package com.jan.diagramcanvas.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jan.diagramcanvas.models.SvgInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.*;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class SaveService {
    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;

    public Long saveTest(String owner, String window, List<SvgInfo> list) throws Exception {
        SetOperations<String, String> set = redisTemplate.opsForSet();
        HashOperations<String, Object, Object> hash = redisTemplate.opsForHash();

        final String hashKey = generateHashKey(owner, window);

        System.out.println("owner and window : " + hashKey);

        set.add(owner, window);

        for (SvgInfo svgInfo : list) {
            String id = svgInfo.getId();
            String attachment = objectMapper.writeValueAsString(svgInfo.getAttachment());
            hash.put(hashKey, id, attachment);
        }

        System.out.println("current size : " + list.size());

//        return hash.size(hashKey);
        return (long) list.size();
    }

    public Long deleteFields(String owner, String window, String ids) throws Exception {
        HashOperations<String, Object, Object> hash = redisTemplate.opsForHash();

        final String hashKey = generateHashKey(owner, window);
        long deleted = 0L;

//        String[] idArray = ids.split("\\+");
        String[] idArray = ids.split(" ");

        System.out.println("owner and window : " + hashKey);
        System.out.println("delete count :" + idArray.length);

        for (String id : idArray) {
            System.out.println(id);
            deleted += hash.delete(hashKey, id);
        }

        return deleted;
    }

    public Map<String, Map<Object, Object>> readTest(String owner) {
        SetOperations<String, String> set = redisTemplate.opsForSet();
        HashOperations<String, Object, Object> hash = redisTemplate.opsForHash();
        Map<String, Map<Object, Object>> windowMap = new HashMap<>();

        final Set<String> windows = set.members(owner);

        assert windows != null;
        for (String windowName : windows) {
            final String hashKey = generateHashKey(owner, windowName);

            Map<Object, Object> entries = hash.entries(hashKey);

            System.out.println("for loop : " + windowName + "/" + entries.size());

            windowMap.put(windowName, entries);
        }

        return windowMap;
    }

    private String generateHashKey (String owner, String windowName) {
        return String.join("+", owner, windowName);
    }

}
