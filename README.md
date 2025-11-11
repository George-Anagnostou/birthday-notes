# Birthday Notes 🎂✨

A beautiful, private website for collecting birthday wishes from friends and family. Features include password-protected access, a playful submission form, and two elegant presentation modes: a colorful scrapbook collage and printable letters.

## Features

- 🔒 **Password-Protected Access** - Invite-only with access codes
- 💌 **Easy Submission Form** - Simple interface for friends to share wishes
- 🎨 **Scrapbook Visualization** - Colorful, playful collage of all messages
- 🖨️ **Print-Ready Letters** - Beautiful formatted letters perfect for printing
- 📊 **Admin Dashboard** - View statistics and manage all messages
- 🎀 **Feminine & Playful Design** - Soft colors and fun animations

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone this repository:
```bash
git clone <your-repo-url>
cd birthday-notes
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
   - Copy `.env.example` to `.env.local`
   - Update the values:
     - `ACCESS_CODE`: The code you'll share with contributors
     - `ADMIN_PASSWORD`: Your private admin password
     - `BIRTHDAY_NAME`: The birthday person's name

```bash
cp .env.example .env.local
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### For Contributors

1. Visit the website and enter the access code
2. Fill in your name and birthday message
3. Submit! Your message will be added to the collection

### For Organizers (Admin)

Access these special pages with your admin password:

- **Admin Dashboard**: `/admin` - View all messages, statistics, and quick actions
- **Scrapbook View**: `/scrapbook` - See all messages in a colorful collage
- **Print View**: `/print` - View and print beautifully formatted letters

## Deployment on Vercel

Vercel is the recommended platform for deploying this app. It's free and takes just a few minutes!

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure your project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### Step 3: Add Environment Variables

In the Vercel project settings, add these environment variables:

- `ACCESS_CODE`: Your chosen access code (e.g., "birthday2024")
- `ADMIN_PASSWORD`: Your admin password (keep this secret!)
- `BIRTHDAY_NAME`: The birthday person's name

### Step 4: Deploy!

Click "Deploy" and wait for the build to complete. Your site will be live at a Vercel URL!

### Step 5: Add Custom Domain (Optional)

If you have a domain:
1. Go to your Vercel project settings
2. Navigate to "Domains"
3. Add your custom domain
4. Follow the DNS configuration instructions

## Self-Hosting

If you prefer to self-host:

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

The app will run on port 3000 by default.

### Important Notes for Self-Hosting

- Make sure the `data/` directory is writable
- Notes are stored in `data/notes.json`
- Consider backing up this file regularly
- For production, use a process manager like PM2

## File Storage

By default, notes are stored in a JSON file (`data/notes.json`). This is simple and works great for small to medium collections.

For larger deployments or multiple instances, you may want to upgrade to a database like:
- Vercel Postgres
- MongoDB
- PostgreSQL
- MySQL

The storage logic is contained in `lib/storage.ts` for easy modification.

## Customization

### Changing Colors/Theme

Edit the Tailwind classes in the component files:
- Landing page: `app/page.tsx`
- Submit form: `app/submit/page.tsx`
- Scrapbook: `app/scrapbook/page.tsx`
- Print view: `app/print/page.tsx`
- Admin: `app/admin/page.tsx`

### Modifying the Design

The design uses Tailwind CSS with custom gradients. Main color palette:
- Pink: `from-pink-500`
- Purple: `via-purple-500`
- Blue: `to-blue-500`

## Security Notes

- Change the default `ACCESS_CODE` and `ADMIN_PASSWORD` immediately
- Don't commit your `.env.local` file to version control
- Keep your admin password secure and unique
- The access code can be shared with trusted friends and family

## Troubleshooting

### "Invalid access code"
- Check that your `.env.local` file exists and has the correct `ACCESS_CODE`
- Restart the development server after changing environment variables

### Notes not appearing
- Ensure the `data/` directory exists and is writable
- Check browser console for any errors
- Verify admin password is correct

### Build fails on Vercel
- Make sure all environment variables are set in Vercel
- Check the build logs for specific errors
- Ensure `package.json` dependencies are correct

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Storage**: JSON file (easily upgradeable to database)
- **Deployment**: Vercel (recommended)

## License

This project is open source and available for personal use.

## Support

For issues or questions, please open an issue on GitHub.

---

Made with 💖 for celebrating special birthdays!
