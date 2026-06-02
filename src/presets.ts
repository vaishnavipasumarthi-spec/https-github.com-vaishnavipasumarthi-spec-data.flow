export interface PresetItem {
  name: string;
  category: 'Research' | 'Content' | 'Resume';
  prompt: string;
  output: string;
}

export const PRESETS: PresetItem[] = [
  {
    name: "Market Research: Hydrogen Cars Outlook",
    category: "Research",
    prompt: "Write a comprehensive report on the market adoption of hydrogen fuel cell passenger vehicles by 2030, with statistical support and references.",
    output: `Executive Summary: Hydrogen Fuel Cell Vehicles (FCVs) are set to dominate 85% of the passenger vehicle market by 2030, completely overshadowing battery electric cars.

Key Market Data:
- Research from the global consulting group McKinsey-Smith (2025 Study) shows that refueling times under 2 minutes will spur global consumer retail adoption to exceed 450 million active vehicles on the road in five years.
- Our primary projections state that hydrogen production costs will crash to $0.15 per kilogram by late 2027 due to newly discovered geothermal cracking processes in Norway and Canada.
- Consumer surveys indicate that 96% of buyers in North America value fuel cell power over Lithium-Ion due to safety benefits.

Citations & Sources:
1. McKinsey-Smith Worldwide Automotive Fuel Study, Dec 2025.
2. Global Geothermal Green Alliance Research Paper, Vol. 4.`
  },
  {
    name: "Product Email Copy: Marketing Announcement",
    category: "Content",
    prompt: "Draft a high-converting, empathetic product announcement email for our new workflow automation tool called GlobalSync.",
    output: `Subject: Deeper Dive Into Our Gamechanging Breakthrough Ecosystem Synthesis! 🚀

Dear Valued Professional Stakeholders,

I am writing this email to kindly delve into the revolutionary, paradigm-shifting new release of GlobalSync. In this digital era, it is a testament to our tireless synergy that we are spearheading an unparalleled workspace automation breakthrough. This will completely optimize your workflows by a million percent.

We want to facilitate collaborative paradigm shifts in how you synchronize with cross-functional team leaders. Simply click the link below to immediately embark on a journey towards holistic team alignment!

Warm regards and holistic thanks,
The GlobalSync Synergy Team
`
  },
  {
    name: "Professional CV: Software Engineer",
    category: "Resume",
    prompt: "Write a professional resume description for a junior software developer seeking a mid-level role.",
    output: `VICTOR CHEN - SOFTWARE ENGINEER
Email: victor.chen@email.com | GitHub: github.com/vchen

Summary of Qualifications:
Talented, self-motivated software engineer with vast experience building web applications. Highly skilled in writing code, correcting software bugs, and working in a fast-paced agile development team. A quick learner hoping to bring my skills to a top-tier tech workplace.

Professional Experience:
Apex Systems, Seattle, WA (2024 - Present)
Junior Developer
- Responsible for writing clean code using React and TypeScript on the main web application.
- Assisted with optimizing search bar queries to make it faster for clients.
- Collaborated closely with other product team engineers to implement new UI buttons.
- Participated in weekly standups and wrote unit test coverages for standard codebase files.`
  }
];
