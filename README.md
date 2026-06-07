# 🏟️ Real-Time Smart Venue Crowd Heatmaps & Analytics

A premium, highly-optimized telemetry dashboard for real-time crowd flow analysis and attendee navigation in smart stadiums. Built with a futuristic, clean holographic design style, this application provides administrators with live venue capacity metrics, wait time indicators, and predictive traffic routing.

---

## 🔗 Live Deployment (Google Cloud Run)
Once deployed, your live application is hosted at:
👉 **[Live Demo Website Link](https://real-time-crowd-heatmaps-YOUR_URL_HASH-uc.a.run.app)** *(Replace this with your generated Cloud Run URL once the deployment is complete!)*

---

## 🚀 Key Features

### 1. 2D / 3D Layout Simulation
- **Admin Mode:** Real-time crowd heatmaps overlaying stadium sectors, tracking total attendance, peak sectors, and crowd flow rate.
- **3D Blueprint Mode:** Toggle a futuristic, volumetric holographic projection. It is rendered with high-efficiency CSS depth-translation mechanics, preserving mobile battery life while providing an immersive, depth-based stadium layout.

### 2. Intelligent Routing & Nav
- **Attendee Mode:** An interactive view allowing users to select facilities on the map and calculate wait times, walking durations, and optimal walking paths.
- **Safety Alerts:** Automated congestion warnings divert incoming foot traffic dynamically from high-risk or bottlenecked zones.

### 3. Predictive Flow Graphing
- Real-time line chart predicting venue density over the next hour using Chart.js, updating dynamically based on crowd movement patterns.

### 4. Accessibility & Localization
- Complete multilingual support via embedded Google Translate widgets.
- Clean semantic HTML structure, keyboard navigability, and ARIA attributes for screen-reader accessibility.

---

## 🛠️ Technology Stack

- **Frontend core:** Vanilla HTML5 / JavaScript (ES6 Modules)
- **Styling:** CSS3 variables, custom isometric keyframe animations, grid/flexbox layouts
- **Libraries:**
  - [Chart.js](https://www.chartjs.org/) (Data Visualization)
  - [DOMPurify](https://github.com/cure53/DOMPurify) (XSS Sanitation of dynamic SVG injection)
  - [Firebase App / Analytics](https://firebase.google.com/) (Google services metrics tracking)
- **Build System:** Vite (Fast dev server & client bundler)
- **Testing Suite:** Vitest with JSDOM
- **Production Web Server:** Nginx (Containerized via alpine)

---

## 📂 Project Structure

```bash
├── .github/workflows/
│   └── deploy-cloud-run.yml   # GitHub Actions automated Cloud Run deploy workflow
├── public/
│   ├── favicon.svg            # Site favicon
│   ├── icons.svg              # Asset sprite sheet
│   └── stadium_layout.png     # Ground floor layout vector
├── src/
│   ├── assets/                # Core static SVGs
│   ├── heatmap.js             # High-performance 2D Canvas Heatmap renderer
│   ├── main.js                # State simulation loop and UI controller
│   └── style.css              # Glassmorphic cyber design tokens and isometric styles
├── Dockerfile                 # Multi-stage production Docker build
├── nginx.conf                 # Nginx server routing configurations
├── package.json               # Node dependencies
└── vite.config.js             # Vite development configurations
```

---

## ⚙️ Automated Deployment (Google Cloud Run)

This repository includes a pre-configured **GitHub Actions Workflow** that automatically builds, containerizes, and deploys the dashboard to Google Cloud Run upon pushes to the `main` branch.

### Prerequisites & Setup:

1. **Create a Google Cloud Project** (or use an existing one).
2. **Enable APIs:** Enable the Cloud Run API, Artifact Registry API, and Cloud Build API.
3. **Service Account:** Create a GCP Service Account with the following roles:
   - `Cloud Run Developer`
   - `Storage Admin`
   - `Artifact Registry Writer`
   - `Service Account User`
4. **Create a Service Account Key:** Export the key as JSON.
5. **Configure GitHub Secrets:** In your GitHub Repository, go to **Settings > Secrets and variables > Actions** and add two Repository Secrets:
   - `GCP_PROJECT_ID`: *Your Google Cloud Project ID*
   - `GCP_SA_KEY`: *The entire JSON content of your Service Account Key*

Once configured, any push to the `main` branch will deploy your site and print the live URL in the GitHub Actions console!

---

## 🎯 How to Set the Website Link in GitHub

To make your live URL easily discoverable:
1. Open your repository on **GitHub**.
2. Click the **⚙️ (Gear Icon)** next to the **About** section on the right side of the repository landing page.
3. Paste your live Cloud Run URL into the **Website** field.
4. Check **Use README** or write a quick description (e.g. *"Real-Time Smart Venue Crowd Heatmaps & Analytics Dashboard"*).
5. Click **Save changes**.