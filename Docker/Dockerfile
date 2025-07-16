# Use official Elasticsearch image
FROM docker.elastic.co/elasticsearch/elasticsearch:8.12.2

# Set environment variables
ENV discovery.type=single-node
ENV xpack.security.enabled=false
ENV bootstrap.memory_lock=true
ENV ES_JAVA_OPTS="-Xms512m -Xmx512m"

# Expose default Elasticsearch ports
EXPOSE 9200 9300
