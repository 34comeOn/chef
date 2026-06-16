export function buildParsePrompt(rawText: string, targetLanguage: string) {
  return {
    model: "llama3.1:latest",
    stream: false,
    options: {
      temperature: 0.0,
      num_ctx: 2048
    },
    system: "You are a professional culinary data extraction engine. Return ONLY a valid JSON object — no markdown, no explanation, no code fences. Analyze text and extract data into a rich structure strictly in English. Rules:\n" +
      "1. Separate ingredient values strictly: '400g' -> quantity: '400', unit: 'g'.\n" +
      "2. CRITICAL FOR SUBSTITUTION: The 'substitution' field must ALWAYS be null unless the raw text EXPLICITLY mentions an alternative ingredient (e.g., 'butter or margarine' -> name: 'butter', substitution: 'margarine'). NEVER put text descriptions, states, or cuts like 'peeled', 'minced', 'chopped', or 'cloves' into the substitution field. If no explicit alternative is mentioned, set 'substitution' to null.\n" +
      "3. For each step, extract 'possibleTimers' if a duration is specified (convert minutes to durationSeconds). Use an empty array [] if no time is mentioned.\n" +
      "4. Optional: If a step contains multiple distinct actions, break them down into 'subTasks'. Otherwise, omit or leave 'subTasks' empty.\n" +
      "5. Extract 'environment': heatLevel must be one of ['low', 'medium', 'high', 'none']. temperatureCelsius should be integer or null. equipmentNeeded is an array of tools used.",
    prompt: rawText,
    format: {
      type: "object",
      properties: {
        title: { type: "string", minLength: 1 },
        language: { type: "string", enum: [targetLanguage] },
        ingredients: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string", minLength: 1 },
              quantity: { type: ["string", "null"] },
              unit: { type: ["string", "null"] },
              substitution: { type: ["string", "null"] }
            },
            required: ["name", "quantity", "unit", "substitution"]
          }
        },
        steps: {
          type: "array",
          items: {
            type: "object",
            properties: {
              stepNumber: { type: "integer" },
              instructionText: { type: "string", minLength: 1 },
              subTasks: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    description: { type: "string", minLength: 1 },
                    activityType: { type: "string", enum: ["preparation", "active_cooking", "passive_waiting"] },
                    relatedIngredients: { type: "array", items: { type: "string" } }
                  },
                  required: ["description", "activityType", "relatedIngredients"]
                }
              },
              possibleTimers: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    label: { type: "string", minLength: 1 },
                    durationSeconds: { type: "integer" }
                  },
                  required: ["label", "durationSeconds"]
                }
              },
              environment: {
                type: "object",
                properties: {
                  temperatureCelsius: { type: ["integer", "null"] },
                  heatLevel: { type: "string", enum: ["low", "medium", "high", "none"] },
                  equipmentNeeded: { type: "array", items: { type: "string" } }
                },
                required: ["temperatureCelsius", "heatLevel", "equipmentNeeded"]
              }
            },
            required: ["stepNumber", "instructionText", "possibleTimers", "environment"]
          }
        }
      },
      required: ["title", "language", "ingredients", "steps"]
    }
  };
}

