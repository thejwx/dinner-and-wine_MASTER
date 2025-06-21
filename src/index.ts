// src/index.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

(async () => { 
  const server = new McpServer({ name: "Dinner and Wine", version: "0.1.0" });

  // Hard-coded cuisine list
  const cuisines = [
    "Italian","French","Mexican",
    "Japanese","Mediterranean","Indian",
    "Thai","Spanish","Korean","Moroccan",
  ];

  // Expose as config://cuisines
  server.resource(
    "cuisineList",
    "config://cuisines",
    async uri => ({
      contents: [{
        uri:      uri.href,
        text:     JSON.stringify(cuisines),
        mimeType: "application/json",
      }],
    })
  );

  // The dinner-and-wine-planner tool
  server.tool(
    "dinner-and-wine-planner",
    {
      mainDish:   z.string(),
      sidesCount: z.number().default(2),
      cuisine:    z.string().optional(),
    },
    async ({ mainDish, sidesCount, cuisine }) => {
      const chosenCuisine =
        cuisine ||
        cuisines[Math.floor(Math.random() * cuisines.length)];
      return {
        content: [
          {
            type: "text",
            text: `Plan some ${chosenCuisine} dinner featuring ${mainDish}: suggest ${sidesCount} sides plus a wine pairing, then explain why that pairing works.`,
          },
        ],
      };
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
})();