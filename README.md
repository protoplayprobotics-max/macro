# CopperTrace Labs — Static Website

Multipage static site (HTML / CSS / JS, no build step) for a PCB design, electronics R&D, embedded and IoT company.

## Pages
- `index.html` — landing page (animated PCB background, services, featured prototypes, process, contact)
- `about.html` — story, mission/vision/values, milestones, team
- `rnd.html` — capabilities, R&D process, research areas, tools & lab equipment
- `products.html` — prototype catalogue with category filters

## Customise
- **Company name**: search & replace `CopperTrace` / `Copper<em>Trace</em> Labs` across the HTML files.
- **Contact details**: replace the placeholder address, phone and `info@coppertracelabs.com` in every page footer and the contact section of `index.html`.
- **Contact form email**: set `CONTACT_EMAIL` at the top of `js/main.js` (the form opens the visitor's email app).
- **Colours**: edit the CSS variables at the top of `css/style.css`.

## Host on GitHub Pages
1. Create a new GitHub repository and push these files to the `main` branch (keep `index.html` at the root).
2. In the repository go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, branch `main`, folder `/ (root)`, and save.
4. The site will be live at `https://<your-username>.github.io/<repo-name>/` in a minute or two.
