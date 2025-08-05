# Deploying a Conversational Customer Care Analytics Assistant Solution with Strands Agents SDK

This solution provides a Generative AI application reference that allows users to interact with customer care performance data through a natural language interface. The solution leverages **[Strands Agents SDK](https://strandsagents.com/)** to build an agent that connects to an existing PostgreSQL database, providing customer care analytics capabilities through a Web Application interface. The infrastructure is deployed using AWS CDK.

<div align="center">
<img src="./images/data-analyst-assistant-strands-agents-sdk.gif" alt="Conversational Customer Care Analytics Assistant Solution with Strands Agents SDK">
</div>

🤖 A Customer Care Analytics Assistant offers an approach to data analysis that enables wireless carriers to interact with their customer care performance data through natural language conversations rather than complex SQL queries. This kind of assistant provides an intuitive question-answering interface for customer experience operations and can be improved by offering data visualizations to enhance the user experience.

✨ This solution enables users to:

- Ask questions about customer care performance data in natural language
- Receive AI-generated responses based on SQL queries to a PostgreSQL database
- View query results in tabular format
- Explore data through automatically generated visualizations
- Get insights and analysis from the AI assistant

🚀 This reference solution can help you explore use cases like:

- Monitor bot vs human interaction performance and optimization opportunities
- Track customer satisfaction scores (CSAT, NPS, CES) across channels
- Analyze escalation patterns and identify improvement areas
- Provide quick answers to executives about customer experience metrics
- Identify high-performing channels and agents for best practice sharing
- Monitor customer journey completion rates and friction points
- Analyze cost per interaction and operational efficiency metrics

## Solution Overview

The following architecture diagram illustrates a reference solution for a generative AI customer care analytics assistant that is built using Strands Agents SDK and powered by Amazon Bedrock. This assistant enables users to access structured customer care performance data that is stored in an existing PostgreSQL database through a question-answering interface.

![Fleet Management Assistant](./images/gen-ai-assistant-diagram.png)

> [!IMPORTANT]
> This sample application is meant for demo purposes and is not production ready. Please make sure to validate the code with your organizations security best practices.
> 
> Cost Alert: This solution will cost approximately $180 USD per month, mainly for Application Load Balancer, Fargate container and VPC NAT Gateway, plus the usage of on-demand services like Amazon Bedrock. Please ensure you understand these costs before deployment.

The solution deploys the following AWS services through AWS CDK:

- **Application Load Balancer and Fargate Container for Strands Agent**: Powers the ***Fleet Management Assistant*** that answers questions by generating SQL queries using Claude 3.7 Sonnet
  - Contains all the logic for agent configuration and tools
  - Built-in tools include:
    - Custom tools:
        - execute_sql_query
        - get_tables_information
    - Strands tool:
        - current_time
- **Existing PostgreSQL Database**: Connects to your existing fleet management database
- **Amazon DynamoDB**: Tracks users' conversations and raw query results
- **Amazon VPC**: Provides network isolation for the application
- **React Web Application**: Delivers the user interface for the assistant
    - The application invokes the agent built with Strands Agents SDK for interacting with the assistant
    - For chart generation, the application directly invokes the Claude 3.5 Sonnet model

> [!NOTE]
> This solution references the use of AWS IAM credentials to connect to Amazon DynamoDB. 🚀 For production deployment, consider integrating Amazon Cognito or another identity provider for proper authentication and authorization instead of using IAM user credentials.

> [!TIP]
> You can also change the data source to connect to your preferred database engine by adapting the Agent's instructions and tool implementations.

> [!IMPORTANT] 
> Enhance AI safety and compliance by implementing **[Amazon Bedrock Guardrails](https://aws.amazon.com/bedrock/guardrails/)** for your AI applications with the seamless integration offered by **[Strands Agents SDK](https://strandsagents.com/latest/user-guide/safety-security/guardrails/)**.

The **user interaction workflow** operates as follows:

- The web application sends user business questions to the agent built with Strands Agents SDK
- The agent (powered by Claude 3.7 Sonnet) processes natural language and determines when to execute database queries
- The agent's built-in tools execute SQL queries against the existing PostgreSQL database and formulate an answer to the question
- After the agent's response is received by the web application, the raw data query results are retrieved from the DynamoDB table to display both the answer and the corresponding records
- For chart generation, the application invokes a model (powered by Claude 3.5 Sonnet) to analyze the agent's answer and raw data query results to generate the necessary data to render an appropriate chart visualization

### Strands Agent Architecture

![Fleet Management Assistant](./images/data-analyst-assistant-strands-agent-diagram.png)

| Feature | Description |
|----------|----------|
| Native Tools   | current_time - A built-in Strands tool that provides the current date and time information based on user's timezone. |
| Custom Tools | get_tables_information - A custom tool that retrieves metadata about the fleet management database tables, including their structure, columns, and relationships, to help the agent understand the database schema.<br>execute_sql_query - A custom tool that allows the agent to run SQL queries against the PostgreSQL database based on the user's natural language questions, retrieving the requested fleet management data for analysis. |
| Model Provider | Amazon Bedrock |

## Fleet Management Database Schema

The solution works with the following key entities:

- **Enterprises**: B2B customers with wireless service subscriptions
- **Devices**: Mobile devices (phones, tablets, IoT devices) assigned to enterprise users  
- **Line Subscriptions**: Individual wireless service lines with data/voice plans
- **Daily Usage**: Usage tracking (data, voice, SMS, roaming) per line
- **Bills**: Monthly billing statements and charges
- **Service Plans**: Available wireless service plans and pricing
- **SIM Inventory**: SIM card management and assignments

## Deployment Instructions

The deployment consists of two main steps:

1. **Generative AI Application - [Fleet Management Data Source and Strands Agent Deployment with CDK](./cdk-strands-data-analyst-assistant/)**
2. **Front-End Implementation - [Integrating Strands Agent with a Ready-to-Use Fleet Management Assistant Application](./amplify-video-games-sales-assistant-strands/)**

> [!NOTE]
> *It is recommended to use the Oregon (us-west-2) or N. Virginia (us-east-1) regions to deploy the application.*

> [!IMPORTANT] 
> Remember to clean up resources after testing to avoid unnecessary costs by following the clean-up steps provided.

## Application Features

The following images showcase a conversational experience analysis that includes: natural language answers, the reasoning process used by the LLM to generate SQL queries, the database records retrieved from those queries, and the resulting chart visualizations.

![Fleet Management Assistant](./images/preview.png)

- **Conversational interface with an agent responding to user questions about fleet management**

![Fleet Management Assistant](./images/preview1.png)

- **Raw query results displayed in tabular format**

![Fleet Management Assistant](./images/preview2.png)

- **Chart visualization generated from the agent's answer and the data query results (created using [Apexcharts](https://apexcharts.com/))**.

![Fleet Management Assistant](./images/preview3.png)

- **Summary and conclusion derived from the fleet management data analysis conversation**

![Fleet Management Assistant](./images/preview4.png)

## Thank You

## License

This project is licensed under the Apache-2.0 License.
