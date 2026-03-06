# **App Name**: NEU Portal Access

## Core Features:

- Secure Google Authentication: Allow users to securely sign in using their Google accounts for a streamlined login experience.
- NEU Email Domain Enforcement: Verify that all signed-in users' email addresses belong to the '@neu.edu.ph' domain, denying access and showing an error if they do not.
- Firestore User Profile Management: Create and manage user profiles in Firestore, including fields for uid, email, fullName, role (admin/user), college_office, and isSetupComplete (boolean).
- First-Time User Onboarding Redirection: Implement logic to check the 'isSetupComplete' field upon login and redirect users to a dedicated 'Onboarding' screen if it's false.
- College/Office Selection Interface: Provide a user interface on the onboarding screen for users to select their respective College or Office from a dropdown menu.
- Onboarding Completion Persistence: Upon submission of College/Office selection, update the 'isSetupComplete' field in Firestore to true, ensuring users bypass onboarding on subsequent logins.

## Style Guidelines:

- Primary color: A deep, professional blue (#0C46A3) to evoke trust and academic professionalism.
- Background color: A very light, desaturated blue (#EEF1F6) to maintain a clean, readable, and institutional appearance.
- Accent color: A vibrant, analogous blue-green (#47C1EB) to highlight interactive elements and provide visual interest.
- Body and headline font: 'Inter' (sans-serif) for its modern, clean, and highly readable qualities, suitable for an academic and administrative context.
- Utilize a set of simple, crisp icons that convey concepts related to user accounts, institutional affiliations, and administrative tasks, ensuring clarity and consistency.
- Employ a clean, structured, and responsive layout, prioritizing clear hierarchy for forms and user information to enhance usability across devices.
- Incorporate subtle and swift animations for transitions, form submissions, and feedback, ensuring a smooth and unobtrusive user experience.