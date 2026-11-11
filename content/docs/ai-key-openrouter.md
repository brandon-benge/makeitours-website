## Bring Your Own Infra needs an AI key

With Bring Your Own Infra, the AI that changes your design runs on your own AI account, so you need an *API key*: a long secret code that lets MakeItOurs use that account for you. If you don't have one, we recommend [OpenRouter](https://openrouter.ai/). One OpenRouter account gives you many AI models, from many companies, under one key and one balance.

> **Rather skip all this? Hosted takes care of it for you.** The AI is included, so there's no key to create, no credits to top up and nothing to replace. Hosted needs no GitHub account either. [See what Hosted includes](https://bengesoftwarellc.com/makeitours-website/hosted.html).

## What it costs

OpenRouter is pay as you go. You add credits, and each request uses a little of them, depending on the model you pick. Some models are free, with a daily request limit. OpenRouter's [FAQ](https://openrouter.ai/docs/faq) explains credits, payment methods and free-model limits.

**Set a spending limit on your key.** OpenRouter lets you give each key a credit limit, and recommends it. Once the key reaches its limit, it stops working until you raise the limit, so a mistake can never spend more than you chose.

## What you'll do

These are the whole setup. The illustrated walkthrough at the end of this page shows the same steps, with an arrow at the button or words to look for on each screen.

1. **Create an OpenRouter account** at [openrouter.ai](https://openrouter.ai/). Press **Sign in** in the top-right corner, choose to sign up, and use your email, Google or GitHub.
2. **Add credits** on the [Credits page](https://openrouter.ai/settings/credits). Start small; you can add more later.
3. **Create a key** on the [Keys page](https://openrouter.ai/settings/keys). Give it a name you'll recognise, such as *MakeItOurs*, and set a credit limit.
4. **Copy the key straight away**, while it's on screen, and keep it private. Treat it like a password: anyone who has it can spend your credits.
5. **Paste the key into MakeItOurs.** On the Mac, open your project's menu and choose **AI Settings…**. On iPhone, open your project's menu and choose **Set Up Remote AI**. Choose **OpenRouter** as the provider and paste the key.
6. **Pick a model.** Press **Fetch Models**, choose one, then press **Save** (Mac) or **Save Selection** (iPhone).

## Changing or replacing your key

You can change your key at any time, for example if it reaches its limit or you think someone else has seen it.

1. Create a new key on OpenRouter's [Keys page](https://openrouter.ai/settings/keys).
2. In MakeItOurs, open **AI Settings…** on the Mac or **Change Remote AI** on iPhone, paste the new key and save.
3. Delete the old key on OpenRouter's Keys page, so it can't be used again.

## How MakeItOurs protects your key

- On the Mac, the key is stored in your Apple Keychain and handed only to the AI tool running on your Mac.
- For requests you send from iPhone, the key is encrypted on your device before it's uploaded as a GitHub secret in your own project. GitHub can't show it again, even to us.
- The key never goes to MakeItOurs servers, and it isn't written to the project or the app's logs.

The [Security](https://bengesoftwarellc.com/makeitours-website/security.html) page explains the details, and the [Privacy](https://bengesoftwarellc.com/makeitours-website/privacy.html) page explains what data is handled and where. OpenRouter's own [privacy policy](https://openrouter.ai/privacy) and [terms](https://openrouter.ai/terms) cover your OpenRouter account.

## Using another AI provider

MakeItOurs also works with OpenAI, Anthropic, Google, Groq, xAI, Mistral, Deep Infra and OpenCode. If you already have a key from one of these, choose that provider instead of OpenRouter in the same screen.

Setting up GitHub as well? See [New to GitHub?](https://bengesoftwarellc.com/makeitours-website/docs/new-to-github/index.html). If anything looks different, email [makeitours-support@bengesoftwarellc.com](mailto:makeitours-support@bengesoftwarellc.com) and tell us which step you're on. Never send us your key.
