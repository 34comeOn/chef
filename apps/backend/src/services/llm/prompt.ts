export function buildParsePrompt(rawText: string, targetLanguage: string): string {
  return `You are a professional culinary data extraction engine. Return ONLY a valid JSON object — no markdown, no explanation, no code fences.
    The JSON must match this exact shape:
    {
      "model": "llama3.1:latest",
      "stream": false,
      "options": {
        "temperature": 0.0,
        "num_ctx": 8192
      },
      "system": "You are a professional culinary data extraction engine. Analyze the unttted text and extract data into a rich structure strictly in English. Rules:\n1. Separate ingredient values strictly: '400g' -> quantity: '400', unit: 'g'. '3 stalks' -> quantity: '3', unit: 'stalks'.\n2. For each step, extract 'possibleTimers' if a duration is specified (convert minutes to durationSeconds). Use an empty array [] if no time is mentioned.\n3. Extract 'environment': heatLevel must be one of ['low', 'medium', 'high', 'none']. temperatureCelsius should be integer or null. equipmentNeeded is an array of tools used in that specific step.",
      "prompt": "${rawText}",
      "format": {
        "type": "object",
        "properties": {
          "title": { "type": "string", "minLength": 1 },
          "language": { "type": "string", "enum": ["${targetLanguage}"] },
          "ingredients": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": { "type": "string", "minLength": 1 },
                "quantity": { "type": ["string", "null"] },
                "unit": { "type": ["string", "null"] },
                "substitution": { "type": ["string", "null"] }
              },
              "required": ["name", "quantity", "unit", "substitution"]
            }
          },
          "steps": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "stepNumber": { "type": "integer" },
                "instructionText": { "type": "string", "minLength": 1 },
                "possibleTimers": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "label": { "type": "string", "minLength": 1 },
                      "durationSeconds": { "type": "integer" }
                    },
                    "required": ["label", "durationSeconds"]
                  }
                },
                "environment": {
                  "type": "object",
                  "properties": {
                    "temperatureCelsius": { "type": ["integer", "null"] },
                    "heatLevel": { "type": "string", "enum": ["low", "medium", "high", "none"] },
                    "equipmentNeeded": { "type": "array", "items": { "type": "string" } }
                  },
                  "required": ["temperatureCelsius", "heatLevel", "equipmentNeeded"]
                }
              },
              "required": ["stepNumber", "instructionText", "possibleTimers", "environment"]
            }
          }
        },
        "required": ["title", "language", "ingredients", "steps"]
      }
    }
  `;
}
