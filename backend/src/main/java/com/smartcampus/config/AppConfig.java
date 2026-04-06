package com.smartcampus.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class AppConfig {

    /**
     * RestTemplate bean used by AttachmentService to call Supabase Storage REST API.
     * Chanuka may replace this with a more fully-configured bean in his security config.
     */
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
