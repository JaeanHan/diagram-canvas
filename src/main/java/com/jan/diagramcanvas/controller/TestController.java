package com.jan.diagramcanvas.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestController {
    // commit test2
    @GetMapping("api/test")
    public String test() {
        return "8080 ON";
    }
}

