{{- define "osac-metering.kafkaClusterName" -}}
osac-kafka
{{- end -}}

{{- define "osac-metering.kafkaClusterNamespace" -}}
osac-kafka
{{- end -}}

{{- define "osac-metering.kafkaBrokers" -}}
osac-kafka-kafka-bootstrap.osac-kafka.svc.cluster.local:9093
{{- end -}}

{{- define "osac-metering.kafkaTopic" -}}
osac.metering.lifecycle
{{- end -}}

{{- define "osac-metering.kafkaCaSecret" -}}
osac-kafka-cluster-ca-cert
{{- end -}}

{{- define "osac-metering.kafkaSaslUsername" -}}
osac-metering
{{- end -}}

{{- define "osac-metering.kafkaSaslSecretName" -}}
osac-metering
{{- end -}}

{{- define "osac-metering.kafkaReplicas" -}}
3
{{- end -}}
