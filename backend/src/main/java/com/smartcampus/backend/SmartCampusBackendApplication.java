package com.smartcampus.backend;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

@SpringBootApplication(scanBasePackages = "com.smartcampus")
@EnableMongoRepositories(basePackages = "com.smartcampus.repository")
public class SmartCampusBackendApplication {

	public static void main(String[] args) {
		// Load .env file into system properties so Spring ${...} placeholders resolve.
		// ignoreIfMissing() keeps this safe in CI/CD where env vars are set natively.
		Dotenv dotenv = Dotenv.configure()
				.ignoreIfMissing()
				.load();
		dotenv.entries().forEach(e -> {
			System.setProperty(e.getKey(), e.getValue());
			if ("MONGODB_URI".equals(e.getKey())) {
				System.setProperty("spring.data.mongodb.uri", e.getValue());
			}
		});

		SpringApplication.run(SmartCampusBackendApplication.class, args);
	}

}
