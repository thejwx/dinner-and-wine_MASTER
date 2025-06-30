# Dinner and Wine MCP Server Guide

A start-to-finish walkthrough for creating, testing, and integrating your **dinner-and-wine-planner** MCP tool.

If you want to simply clone this repo and get the super skinny walkthrough, jump to Step 9 below.

---

## 1. Create & Open Your Project Folder  
**What this does:** Sets up an isolated workspace and tells VS Code where to run your commands.

1. **Open** Terminal
2. **Paste** in the following:

- **Don't forget** to update `[your_workspace_path]` with your path

```bash
mkdir ~/[your_workspace_path]/dinner-and-wine
```

3. **In VS Code:** File > Open Folder… → select `~/[your_workspace_path]/dinner-and-wine` → Open  

- Your integrated terminal now defaults to this folder
- You'll need the terminal for upcoming steps

---

## 2. Initialize NPM & TypeScript  
**What this does:** Bootstraps your Node project and enables writing & running TypeScript.

1. **In VS Code:** Terminal > New Terminal
2. **Paste** the following into the Terminal panel:

```bash
npm init -y
npm install --save-dev typescript ts-node @types/node
npx tsc --init
```

---

## 3. Install the MCP SDK & Zod  
**What this does:** Brings in the core MCP framework and runtime schema validation.

1. Paste the following into the Terminal panel:

```bash
npm install @modelcontextprotocol/sdk zod
```

---

## 4. Create Your MCP Server  
**What this does:** Defines the `dinner-and-wine-planner` tool and hard-coded `cuisine` resource.

- In the project root, create a file named `index.ts` in a new `src` folder
- You can of course use menus and buttons to create the file but this ensures it is created in the proper place

1. **Paste** the following into the Terminal panel:

```
mkdir src 
cd src
touch index.ts
cd ..
```

2. **Open** `src/index.ts` and paste the following code:

```ts
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
    "cuisine-list",
    "config://cuisines",
    async uri => ({
      contents: [{
        uri:      uri.href,
        text:     JSON.stringify(cuisines),
        mimeType: "application/json",
      }],
    })
  );

  // The main tool constructing teh prompt for the full meal with wine
  server.tool(
    "full-meal-with-wine-recommendation",
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
```

3. **Save** the file.

---

## 5. Launch the Local MCP Inspector  
**What this does:** Runs your server and opens a UI to exercise the tool over stdio.

- Consider your current Terminal instance as **Terminal A** which will run your MCP server

1. **Paste** the following into the Terminal panel:

  ```bash
  npx ts-node src/index.ts
  ```

- A new Terminal instance, **Terminal B**, will run the MCP Inspector to test your server

2. **In VS Code:** Terminal > New Terminal
3. **Paste** the following into the Terminal panel:

  ```bash
  npx @modelcontextprotocol/inspector npx ts-node src/index.ts
  ```

---

## 6. Test Your MCP in the MCP Inspector  
**What this does:** Allows you to test your code before exposing as an MCP server.

- **In Terminal B** you will see a URL with a MCP_PROXY_AUTH_TOKEN passed in the query string similar to the following:

```
🔗 Open inspector with token pre-filled:
   http://localhost:6274/?MCP_PROXY_AUTH_TOKEN=1234567890abcdefghijklmnopqrstuvwxyz
   (Auto-open is disabled when authentication is enabled)
```

1. **Open** the URL with the auth token in a browser (copy/paste or CMD+click the URL)
2. **Click** the `> ⚙️ Configuration` button to expand the settings
3. **Ensure** the `Proxy Session Token` field is set to the authentication token from **Terminal B**
4. **Click** the `▷ Connect` button
- You should see `🟢 Connected` displayed
5. **Click** the `Tools` button from the navigation header at the top of the Inspector
6. **Click** the `List Tools` button then `dinner-and-wine-planner` when it appears
7. **Enter** `chicken` in the **mainDish** field in the right-hand panel
  - Leave **sidesCount** and **cuisine** as they are
8. **Scroll down** in the right-hand panel and **click** `Run Tool`
  - You should see `Tool Result: Success` displayed (you may need to scroll down more) with a response similar to:
    ```
    "Plan some Moroccan dinner featuring chicken: suggest 2 sides plus a wine pairing, then explain why that pairing works."
    ```
9. **Click** `Run Tool` again to see a different cuisine's recipe
10. **Enter** a cuisine (e.g. “Italian”) in the `cuisine` field and click `Run Tool` again
  - (Optional) Change `sidesCount` and click **Run Tool** (but you can probably imaging what will happen)

---

## 7. Hook into Roo Code Globally  
**What this does:** Registers your tool in Roo so it’s available in every project.

1. **Click the kangaroo icon** in VS Code’s Activity Bar on the left
2. **In the `ROO CODE` panel**, click the **MCP Servers** icon (three stacked bars at the top)
3. Click **Edit Global MCP** to open `mcp_settings.json`.
4. Under `"mcpServers"`, add the following just after `  "mcpServers": {`:

- **Don't forget** to update `[your_workspace_path]` with your path
- **Add** a comma at the end if you already have MCP servers 

   ```json
   "dinner-and-wine-planner": {
     "transport": "stdio",
     "command":   "npx",
     "args":      ["ts-node", "src/index.ts"],
     "cwd":       "/[your_workspace_path]/dinner-and-wine"
   }
   ```
5. **Save** the file 
6. You may see it immediately; otherwise close & reopen the MCP panel or click the ↻ **Refresh** button
7. **Click** the `Done` button in the `ROO CODE` panel

---

## 8. Invoke Your Tool from Any Project  
**What this does:** Demonstrates your server works globally with natural language.

1. **Paste** the following into the Terminal panel to create and open a new, test folder as if it were a new project:

- **Make sure** you are in the root folder of your project.

```bash
mkdir ../temp-mcp-test
cd ../temp-mcp-test
code .
```

2.  **Click the kangaroo icon** again in VS Code’s Activity Bar on the left to open the ROO CODE extension
3. **In the prompt box**, enter the following and ROO CODE should be able to figure out it needs to use a tool:

  ```
  Give me a dinner idea for chicken
  ```

4. **Click** the Approve button to allow the MCP to be run (and optionally check the **Always Allow** checkbox)

- If you check **Always Allow**, Roo will always use this MCP automatically if it feels it needs it and without waiting for you to respond to it
- You can always deselect **Always Allow** in the MCP Server settings
- Roo will display the response with sides and wine information

5. **In the prompt box**, enter each of the following (or whatever you want, what do I care):

- Switch it up, because it is within the same thread, it will figure out inputs from the full conversation
- FYI, no luck across sessions or different threads, but that's wjere Agent to Agent (A2A) come is (for a later walkthrough)

```
Actually make it an Ethiopian version.
```

- Mess around with inputs, you don't need to be as strict as with an API call, it'll just figure it out

```
How about a Mexican dinner with beef and 3 sides?
```

- Let's call the MCP Resource directly...

```
What other cuisines are available?
```

- One more for good luck, this one may come back to ask questions to better understand the request
- If so, follow it up with `Just use what I said...`

```
I want an Brazilian feast and I have a big family so need lots of sides.
```

---

🎉 **Complete!** You now have a fully integrated **dinner-and-wine-planner** MCP server. Enjoy planning dinner and wine pairings anywhere.

---

## 9. Get the Uber-Brief Walkthrough Cloning this Project  
**What this does:** Simplifies the steps down to cloning, tweaking for your environment, and running.

### 9.1 Clone the Repo Locally

1. **Open** Terminal
2. **Paste** in the following:

- This navigates to the Desktop, clones the repo, navigates to the new project, and opens Visual Studio Code to this project

```
cd ~/Desktop
git clone https://github.com/thejwx/dinner-and-wine_MASTER dinner-and-wine_MASTER
cd ~/Desktop/dinner-and-wine_MASTER
code .
```

### 9.2 Test Your MCP in the MCP Inspector  
**What this does:** Allows you to test your code before exposing as an MCP server.

- If you want to try out the MCP Inspector that comes with the @modelcontextprotocol/sdk package, jump to step 6
- The whole MCP Inspector demo is encapsulated in step 6, come back here after testing that


### 9.3 Hook into Roo Code Globally  
**What this does:** Registers your tool in Roo so it’s available in every project.

1. **Click the kangaroo icon** in VS Code’s Activity Bar on the left
2. **In the `ROO CODE` panel**, click the **MCP Servers** icon (three stacked bars at the top)
3. Click **Edit Global MCP** to open `mcp_settings.json`.
4. Under `"mcpServers"`, add the following just after `  "mcpServers": {`:

- **Don't forget** to update `[your_workspace_path]` with your path
- **Add** a comma at the end if you already have MCP servers 
- **NOTE:** the path here is slightly different than in the detailed steps above since cloning the repo set the folder name to `dinner-and-wine_MASTER` which is different - just so you know

   ```json
   "dinner-and-wine-planner": {
     "transport": "stdio",
     "command":   "npx",
     "args":      ["ts-node", "/[your_workspace_path]/src/index.ts"],
     "cwd":       "/[your_workspace_path]/dinner-and-wine_MASTER"
   }
   ```
5. **Save** the file 
6. You may see it immediately; otherwise close & reopen the MCP panel or click the ↻ **Refresh** button
7. **Click** the `Done` button in the `ROO CODE` panel

## 9.4 Run the MCP 
**What this does:** Demonstrates your server works globally with natural language.

- To test the MCP server, jump to step 8
- You do not need to spin up a new project if you don't want to, you can skip the first step and jump to opening ROO CODE
- Creating a new project simply demonstrates that this MCP can function in any project on your local machine

---

🎉 **Complete!** You now have a fully integrated **dinner-and-wine-planner** MCP server. Enjoy planning dinner and wine pairings anywhere.

---