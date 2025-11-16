# A Piece Of Advice

![Home Page Screenshot](public/ss1.png)

Lightweight Next.js app (App Router) + Supabase for auth + Postgres. People can send short pieces of advice to each other via a per-user public give link: `/give/<username>`. The app includes a small dashboard, per-advice delete for owners, and server-authoritative writes for security.

![Dashboard Screenshot](public/ss2.png)
![Give link Screenshot](public/ss3.png)


## Quick start (developer)

1. Add supabase env vars into `.env.local`:

2. Install and run locally:

```bash
npm install
npm run dev
```

3. Sign in (Google) and open your dashboard to see incoming advice.

## Project overview

- Framework: Next.js (App Router), React, TypeScript
- UI: Tailwind CSS
- Auth & DB: Supabase (Auth + Postgres)


## License

This project is open-source under the **MIT License**.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
