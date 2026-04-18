package com.smartcampus.backend;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MongoConfig {

    @Bean
    public MongoClient mongoClient() {
        String mongoUri = System.getProperty("MONGODB_URI");
        if (mongoUri == null || mongoUri.isBlank()) {
            mongoUri = System.getenv("MONGODB_URI");
        }
        if (mongoUri == null || mongoUri.isBlank()) {
            mongoUri = "mongodb://localhost:27017/SmartCampus";
        }
        return MongoClients.create(mongoUri);
    }
}
