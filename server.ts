import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use(express.json({ limit: '5mb' }));

  let aiClient: GoogleGenAI | null = null;

  function getAiClient(): GoogleGenAI {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("系統未檢測到有效的 GEMINI_API_KEY 環境變數。請在 AI Studio 的 Settings -> Secrets 設定中，將您的 Gemini API Key 填入，即可啟用 AI 占星報告生成功能。");
      }
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          timeout: 600000,
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return aiClient;
  }

  app.post("/api/generate-report", async (req, res) => {
    const { chartData, prompt } = req.body;
    
    try {
      const ai = getAiClient();
      
      // We try a sequence of candidate models to maximize resilience against model-specific demand spikes (503s)
      const modelsToTry = [
        "gemini-3.5-flash", 
        "gemini-3.1-pro-preview",
        "gemini-flash-latest", 
        "gemini-3.1-flash-lite"
      ];
      let lastErrorMsg = "";
      
      for (const modelName of modelsToTry) {
        let retries = 2; // 2 retries per model, giving 3 attempts per model
        let delayMs = 1500;
        
        while (retries >= 0) {
          try {
            console.log(`[Gemini API] Attempting report generation with model: ${modelName} (${retries} retries left for this model)...`);
            const isGemini3 = modelName.includes("gemini-3");
            const genConfig: any = {
              maxOutputTokens: 8192
            };
            if (isGemini3) {
              genConfig.thinkingConfig = {
                thinkingBudget: 1024
              };
            }

            const result = await ai.models.generateContent({
              model: modelName,
              contents: `${prompt}\n\n星盤數據: ${JSON.stringify(chartData)}`,
              config: genConfig,
            });
            console.log(`[Gemini API] Success using model: ${modelName}!`);
            return res.json({ report: result.text });
          } catch (error: any) {
            lastErrorMsg = error.message || JSON.stringify(error);
            console.error(`[Gemini API] Error using ${modelName}: ${lastErrorMsg}. Retries left: ${retries}`);
            
            const errorStr = lastErrorMsg.toLowerCase();
            const isTransientBusy = errorStr.includes("503") || 
                                    errorStr.includes("unavailable") || 
                                    errorStr.includes("high demand") ||
                                    errorStr.includes("resource_exhausted") ||
                                    errorStr.includes("exhausted") ||
                                    errorStr.includes("quota") ||
                                    errorStr.includes("rate limit") ||
                                    errorStr.includes("429");
            
            if (isTransientBusy) {
              console.log(`[Gemini API] Model ${modelName} is busy or rate-limited. Immediately switching to the next candidate model to avoid delay.`);
              break; // Break out of retry loop for this model, moving on to the next model in modelsToTry
            }
            
            if (retries === 0) {
              // Move on to next model in the list
              break;
            }
            retries -= 1;
            await new Promise(resolve => setTimeout(resolve, delayMs));
            delayMs *= 2; // Exponential backoff
          }
        }
      }
      
      // If we got here, all models in the first sweep failed or were busy.
      // Let's do one final sweep with a brief delay as a last-resort retry.
      console.log(`[Gemini API] First sweep of all models failed. Initiating final last-resort sweep...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      for (const modelName of modelsToTry) {
        try {
          console.log(`[Gemini API] Last-resort attempt with model: ${modelName}...`);
          const isGemini3 = modelName.includes("gemini-3");
          const genConfig: any = {
            maxOutputTokens: 8192
          };
          if (isGemini3) {
            genConfig.thinkingConfig = {
              thinkingBudget: 1024
            };
          }

          const result = await ai.models.generateContent({
            model: modelName,
            contents: `${prompt}\n\n星盤數據: ${JSON.stringify(chartData)}`,
            config: genConfig,
          });
          console.log(`[Gemini API] Last-resort Success using model: ${modelName}!`);
          return res.json({ report: result.text });
        } catch (error: any) {
          lastErrorMsg = error.message || JSON.stringify(error);
          console.error(`[Gemini API] Last-resort attempt failed for ${modelName}: ${lastErrorMsg}`);
        }
      }
      
      // If all models and all retries failed
      console.error(`[Gemini API] All models exhausted. Final error: ${lastErrorMsg}`);
      return res.status(503).json({ 
        error: `占星分析 AI 引擎目前因訪問量過大（Gemini API 503 暫時忙碌）無法提供服務。請稍後重新點擊「生成分析」重試！\n(系統錯誤訊息: ${lastErrorMsg})` 
      });
    } catch (err: any) {
      console.error(`[Gemini API] Initialisation or process error: ${err.message}`);
      return res.status(400).json({
        error: err.message || "初始化或呼叫 AI 模組時發生未知錯誤"
      });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
  
  // Set timeouts to 10 minutes to allow long-running Gemini API calls
  server.keepAliveTimeout = 600000;
  server.headersTimeout = 601000;
  server.requestTimeout = 600000;
  server.timeout = 600000;
}

startServer();
