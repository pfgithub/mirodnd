tools for D🙲D automation in Miro

# features

- instant jump. miro has links but they play a slow animation. this adds an instant jump button.
- dice. roll a d20.

# todo

- rather than activating onselection, maybe activate when you click the buton in the bottom bar idk

# building

local testing: https://developers.miro.com/docs/how-to-start

point miro at `https://pfg.pw/mirodnd/app-dev.html` and set permissions boards:read boards:write and install the app

run `http-server dist -c-1 -p 8020 --cors dist/`

also set the meta_id in index.ts to your app id (TODO make this part of esbuild rather than stored in-code)

prod:

point miro at `https://pfg.pw/mirodnd/app.html`
