# CONTEXT
You are a data engineering and must provide a data model where you can store the raw data coming from different customer care channels from a wireless carrier, the objetive of this database (RDS postgresql) is to support a new performance measure platform  for customer experience  of the digital channels with customers as part of Customer journeys.

You must consider at least the next tables:

- customers: where we will have a basic profile of the mobile subscriber: 
	* type: prepid, postpaid, etc
	* name
	* MSISNDN
	* region (R9 or DEUR) 
	add more fields based on your experience
- channels: where we will have at least : mobile_app, web_app, interactive_menu, chatbot
- customer_interactions: where we will have
	* type: balance_query, invoice_download, invoicement_payment, top_up, history_query, purchase_addon, etc . Add more examples of customer_interactions based on your knowledge of typical actions made by subscribers in digital channels
	* channel_id: each unique interaction belongs to a specific channel
	* timestamp of the event
	* duration of the event when it was by channel chatbot and "LiveChat" to measure how many minutes where Human involved
	* status: where I can use to measure the sucess of the failure of the interaction, 
	* error: if status is failed, here we can report the HTTP or internal error code
	* device_type: useful when channel type is mobile_app, we can measure if devide is android or apple
	* client_type



- Include more tables as needed, the idea is to create a strong and holistic data model to create later a data layer, analytics and gen-ai layers 

## BUSINESS REQUIREMENTS
- In the mobile app they want to measure how many customer interactions are managed by the "BOT", "LiveChat". if the customer interacts only with Bot will count through BOT interactions, but if users wants to talk to a Human then the interaction will count towars  "LiveChat" only. The interactions must

