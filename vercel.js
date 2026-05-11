{
  "version": 2,
  "functions": {
    "api/roblox.js": {
      "maxDuration": 10
    }
  },
  "headers": [
    {
      "source": "/api/roblox",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, OPTIONS"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/roblox",
      "destination": "/api/roblox.js"
    }
  ]
}
