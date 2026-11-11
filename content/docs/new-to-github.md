## You don't need to know GitHub

Bring Your Own Infra keeps your project in your own GitHub account. If you have never used GitHub, that's fine: you only need a free account and about ten minutes, and you never have to touch code or commands. MakeItOurs does the GitHub work for you after you connect.

Don't want a GitHub account at all? Choose [Hosted](https://bengesoftwarellc.com/makeitours-website/hosted.html) instead. Hosted keeps your projects on MakeItOurs servers and needs no GitHub account and no AI provider key.

## What GitHub is, and why Bring Your Own Infra uses it

[GitHub](https://github.com/about) is a widely used service, owned by Microsoft, for storing projects and their history. With Bring Your Own Infra, each MakeItOurs project is a private folder on GitHub (GitHub calls it a *repository*). That gives you:

- Every saved version of your design, so you can go back to any earlier one.
- Your project in an account you own and control, not ours.
- Builds that run in your own GitHub account when you send a request from your iPhone.

**A free GitHub account is enough.** GitHub's [plans page](https://github.com/pricing) lists what the free plan includes. MakeItOurs never asks you to pay GitHub.

## What you'll do

These are the whole setup. The illustrated walkthrough at the end of this page shows the same steps, with an arrow at the button or words to look for on each screen. GitHub sometimes moves things around, but the names stay the same.

1. **Create your account** at [github.com/signup](https://github.com/signup). Enter your email, a password and a username. Your username is public, so pick something you're happy for others to see.
2. **Verify your email.** GitHub emails you a code. Type it into the sign-up page.
3. **Turn on two-factor sign-in.** This protects your account if your password ever leaks. Open your profile picture, then **Settings**, then **Password and authentication**, and press **Enable two-factor authentication**. GitHub explains it in [Configuring two-factor authentication](https://docs.github.com/en/authentication/securing-your-account-with-two-factor-authentication-2fa/configuring-two-factor-authentication). An authenticator app or a passkey both work.
4. **Save your recovery codes somewhere private.** Press **Download** under *Save your recovery codes* and keep the file in a safe place, such as your password manager. They let you back in if you lose your phone. Never share them with anyone, including us. MakeItOurs support will never ask for them.
5. **Connect GitHub in MakeItOurs.** Press **Connect GitHub**. The app shows a short one-time code and opens GitHub's device page. Type the code there and press **Authorize**.
6. **Install the MakeItOurs App** on GitHub when MakeItOurs asks, or open [the MakeItOurs App page](https://github.com/apps/makeitours/installations/new) yourself. Choose your account.
7. **Choose repositories.** Pick **Only select repositories** and choose your MakeItOurs projects, then press **Install**. MakeItOurs can add new projects it creates for you to this list.

If anything looks different from these steps, email [makeitours-support@bengesoftwarellc.com](mailto:makeitours-support@bengesoftwarellc.com) and tell us which step you're on. Never send a password, code or recovery code.

## What the MakeItOurs App can and can't do

GitHub shows the exact permission list on the install page before you approve anything, and you can review it again at any time.

**It can, only in the repositories you choose:**

- Read and save your project's files and their version history.
- Create a new private project repository when you start or copy a project.
- Store your AI settings and your AI provider key as an encrypted GitHub secret, so builds can use it. GitHub never shows a stored secret again, even to us.
- Start and read the builds that run your requests in GitHub Actions.
- Open and update the request items that track each change.
- Publish your project's viewer page when you choose to publish it.

**It can't:**

- See any repository you didn't choose.
- Read your GitHub password, your two-factor codes or your recovery codes.
- Change any repository you didn't choose, or your account settings.
- Send your project to MakeItOurs servers. With Bring Your Own Infra, your project stays in GitHub and on your devices.

Your GitHub connection is stored in your Apple Keychain on your device. The [Security](https://bengesoftwarellc.com/makeitours-website/security.html) page explains exactly how the connection and your AI key travel, and the [Privacy](https://bengesoftwarellc.com/makeitours-website/privacy.html) page explains what data is handled and where.

## How to remove access

You're always in control. To stop MakeItOurs using GitHub:

- **Remove the app:** on GitHub, open **Settings**, then **Applications**, then **Installed GitHub Apps**, and press **Configure** next to MakeItOurs. Change which repositories it can use, or press **Uninstall**. GitHub explains this in [Reviewing and modifying installed GitHub Apps](https://docs.github.com/en/apps/using-github-apps/reviewing-and-modifying-installed-github-apps).
- **Sign MakeItOurs out:** on the **Authorized GitHub Apps** tab, press **Revoke** next to MakeItOurs. GitHub explains this in [Reviewing and revoking authorization of GitHub Apps](https://docs.github.com/en/apps/using-github-apps/reviewing-and-revoking-authorization-of-github-apps).

Your repositories stay in your account after you remove the app. Nothing is deleted.

## You'll also need an AI key

Bring Your Own Infra also uses your own AI account. If you don't have an AI key yet, [Need an AI key?](https://bengesoftwarellc.com/makeitours-website/docs/ai-key-openrouter/index.html) walks through getting one from OpenRouter, step by step.

## More help from GitHub

- [Creating an account on GitHub](https://docs.github.com/en/get-started/start-your-journey/creating-an-account-on-github)
- [Verifying your email address](https://docs.github.com/en/account-and-profile/how-tos/email-preferences/verifying-your-email-address)
- [Recovering your account if you lose your two-factor credentials](https://docs.github.com/en/authentication/securing-your-account-with-two-factor-authentication-2fa/recovering-your-account-if-you-lose-your-2fa-credentials)
- [GitHub's privacy statement](https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement)
