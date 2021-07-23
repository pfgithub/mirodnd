tools for D🙲D automation in Miro

# features

- instant jump. miro has links but they play a slow animation. this adds an instant jump button.
- dice. roll dice.

# todo

- a token library that you can add and remove tokens from. like the token is a miro object and then you can drag the tokens onto the board.
- fight helpers like calculations and stuff
- character sheets?

# building

local testing: https://developers.miro.com/docs/how-to-start

point miro at `https://pfg.pw/mirodnd/app-dev.html` and set permissions boards:read boards:write and install the app

run `yarn dev` and `http-server dist -c-1 -p 8020 --cors dist/`

production:

point miro at `https://pfg.pw/mirodnd/app.html`

reminder:

```js
import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import WindiCSS from "vite-plugin-windicss";
import {resolve} from "path";

export default defineConfig({
  plugins: [
    solidPlugin(),
    WindiCSS({
      scan: {
        fileExtensions: ["html", "js", "ts", "jsx", "tsx"],
      },
    }),
```