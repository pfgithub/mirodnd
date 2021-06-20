tools for D🙲D automation in Miro

local testing: https://developers.miro.com/docs/how-to-start

point miro at `https://pfg.pw/mirodnd/app-dev.html` and set permissions boards:read boards:write and install the app

run `http-server dist -c-1 -p 8020 --cors dist/`

also set the meta_id in index.ts to your app id (TODO make this part of esbuild rather than stored in-code)

prod:

point miro at `https://pfg.pw/mirodnd/app.html`
