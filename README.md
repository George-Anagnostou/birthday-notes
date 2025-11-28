# Birthday Notes 🎂✨

A private website for collecting birthday wishes from friends and family. Features include password-protected access, a easy submission form, and two elegant presentation modes: a colorful memory board collage and printable letters.

## Features

- 🔒 **Password-Protected Access** - Invite-only with access codes
- 💌 **Easy Submission Form** - Simple interface for friends to share wishes
- 🎨 **Memory Board Visualization** - Colorful, playful collage of all messages
- 🖨️ **Print-Ready Letters** - Beautiful formatted letters perfect for printing
- ☁️ **Cloud Print Integration** - Professional PDF generation via cloud printing service
- 📊 **Admin Dashboard** - View statistics and manage all messages

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
     - `CLOUD_PRINT_SERVICE_URL`: (Optional) URL for cloud printing service

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
- **Memory Board View**: `/memory-board` - See all messages in a colorful collage
- **Print View**: `/print` - View and print beautifully formatted letters
- **Cloud Print API**: `/api/cloud-print` - Send cards to cloud printing service (see [CLOUD_PRINT_INTEGRATION.md](./CLOUD_PRINT_INTEGRATION.md))

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
