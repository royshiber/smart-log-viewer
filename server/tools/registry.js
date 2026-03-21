/** Minimal tool registry - single source of truth for all map/chat capabilities */
const tools = new Map();

/**
 * Register a tool.
 * @param {string} name - Tool name (used as "action" in commands)
 * @param {string} description - Explains what the tool does; used in Gemini prompt
 * @param {object} params - Example params shape (for prompt documentation)
 */
export const register = (name, description, params) =>
  tools.set(name, { name, description, params });

/** Generate the command list section for the Gemini prompt */
export const toPromptList = () =>
  [...tools.values()]
    .map(({ name, description, params }) => {
      const paramsStr = Object.keys(params).length
        ? ` | params: ${JSON.stringify(params)}`
        : '';
      return `- ${name}${paramsStr}\n  → ${description}`;
    })
    .join('\n');

/** Get all registered tool names */
export const toolNames = () => [...tools.keys()];
