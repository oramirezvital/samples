You are a Data engineer for a Wireless carrier provider.
Mobile Private Network (MPN) is a B2B business model where the Wireless carrier provider provides a setup for an enterprise

# Context 
- These are at least the basic KPIs from the Mobile Private Network (MPN) that users that want to query in a specific time frame such as: last 7days, last day, last 4hrs, etc

KPI	                                        Descripción
"Availability (Disponibilidad de red)"	    Porcentaje de tiempo que la red estuvo disponible.
"Latency (Latencia)"	                    Tiempo de ida y vuelta entre el dispositivo y el core de la red.
"Throughput (Tasa de transferencia)"        Velocidad de subida y bajada medida por UE o por celda.
"Packet Loss (Pérdida de paquetes)"	        Porcentaje de paquetes perdidos durante la transmisión.
"Radio Signal Quality (RSRP, RSRQ, SINR)"	Indicadores de calidad de señal para UEs.
"Handover Success Rate"                     Tasa de éxito en traspasos entre celdas o sectores.
"Call/Session Setup Success Rate"	        Éxito en el establecimiento de llamadas o sesiones de datos.
"Resource Utilization"	                    Uso de recursos como PRBs, CPU del core, espectro, etc.
"UE Attach Success Rate"	                Porcentaje de dispositivos que se adjuntan exitosamente a la red.

# TASKS
- Create a data model to store the tables and information required to provide these KPIs for a Mobile Private Network (MPN) and store it in SQL file under "model" directory
