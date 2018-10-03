# srcmapit

Command line utility for decoding original javascript source code position from transformed target position.
Useful when your logging system records stack traces with minimized/transformed code positions.

Uses Mozilla's awesome [source-map library](https://github.com/mozilla/source-map).

## usage

```bash
npm install -g srcmapit
```

```text
Usage: srcmapit [target]

Decode original javascript source code position from transformed target position.

[target] takes the form of: "{url}:{line#}:{column#}"
[target] example: "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js:2:10"
```