import type { Locale } from "@/lib/recipes";

// Builds an inline <script> body that synchronously registers the site's
// WebMCP tools at HTML parse time — before React hydrates. This gives
// WebMCP clients (and detection bots using CDP-injected shims) a
// guaranteed chance to observe registerTool calls even if their probe
// window closes before our React bundle hydrates. Real implementations
// are supplied later by WebMCPProvider via window.__webmcpImpl.
export function webMcpInlineScript(locale: Locale): string {
  const tools = [
    {
      name: "search_recipes",
      description:
        "Search Savta's recipe collection by name, ingredient, or tag. Returns matching recipes with slugs and URLs.",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query — recipe name, ingredient, or tag",
          },
        },
        required: ["query"],
      },
      annotations: { readOnlyHint: true },
    },
    {
      name: "list_all_recipes",
      description:
        "List every recipe in Savta's collection with names, tags, and page URLs.",
      inputSchema: { type: "object", properties: {} },
      annotations: { readOnlyHint: true },
    },
    {
      name: "navigate_to_recipe",
      description: "Navigate the browser to a specific recipe page.",
      inputSchema: {
        type: "object",
        properties: {
          slug: {
            type: "string",
            description: "Recipe slug from search_recipes or list_all_recipes",
          },
        },
        required: ["slug"],
      },
    },
    {
      name: "navigate_to_search",
      description:
        "Navigate to the recipe search page, optionally pre-filled with a query.",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Optional search query to pre-fill",
          },
        },
      },
    },
  ];

  // Tool metadata is safe-JSON. We attach an execute stub that waits up
  // to 10s for WebMCPProvider to populate window.__webmcpImpl[name].
  return `(function(){
var mc=navigator.modelContext;
if(!mc)return;
window.__webmcpLocale=${JSON.stringify(locale)};
window.__webmcpImpl=window.__webmcpImpl||{};
var tools=${JSON.stringify(tools)};
function stub(name){return function(input){return new Promise(function(resolve){var start=Date.now();(function poll(){var fn=window.__webmcpImpl[name];if(fn){try{Promise.resolve(fn(input)).then(resolve,function(e){resolve({error:String(e)})})}catch(e){resolve({error:String(e)})}return}if(Date.now()-start>10000){resolve({error:"tool "+name+" not ready"});return}setTimeout(poll,50)})()})}}
for(var i=0;i<tools.length;i++){tools[i].execute=stub(tools[i].name)}
if(typeof mc.registerTool==="function"){for(var j=0;j<tools.length;j++){try{mc.registerTool(tools[j])}catch(e){}}}
else if(typeof mc.provideContext==="function"){try{mc.provideContext({tools:tools})}catch(e){}}
})();`;
}
