import { BaseMessage } from "@langchain/core/messages";
import {
  Annotation,
  StateGraph,
  START,
  END,
  messagesStateReducer,
} from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";

// Define the state of the agent
const GraphAnnotation = Annotation.Root({
  messages: Annotation({
    reducer: messagesStateReducer,
    default: () => [],
  }),
});

// Create a simple agent that uses OpenAI
const agentNode = async (state, config) => {
  const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0,
  });
  
  const response = await model.invoke(state.messages);
  
  return {
    messages: [response],
  };
};

// Define the graph
const workflow = new StateGraph({
  input: GraphAnnotation,
  output: GraphAnnotation,
})
  .addNode("agent", agentNode)
  .addEdge(START, "agent")
  .addEdge("agent", END);

// Compile the graph
export const graph = workflow.compile();