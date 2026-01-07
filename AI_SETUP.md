# AI Configuration Guide

## Overview

Arture uses multiple AI providers for design assistance:
- **Primary**: Google Gemini API
- **Fallback**: OpenRouter (with multiple models)

The system automatically falls back to OpenRouter if Gemini is rate-limited or unavailable.

---

## Quick Fix for Current Issues

### Problem: "429 Too Many Requests" / Slow Responses

**Root Cause**: Free tier Gemini API quota exhausted, and free OpenRouter models are also rate-limited.

**Solution**: Use paid tier API keys or wait for quota reset (24 hours).

---

## Environment Variables

Add these to your `.env.local`:

```env
# Google Gemini API Keys (Primary)
GEMINI_API_KEY=your_primary_gemini_key
GEMINI_API_KEY_2=your_backup_gemini_key_1
GEMINI_API_KEY_3=your_backup_gemini_key_2
GEMINI_API_KEY_4=your_backup_gemini_key_3
GEMINI_API_KEY_5=your_backup_gemini_key_4

# OpenRouter API Keys (Fallback)
OPENROUTER_API_KEY=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
OPENROUTER_API_KEY_2=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
OPENROUTER_API_KEY_3=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

# App URL (for OpenRouter)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Getting API Keys

### 1. Google Gemini API (Free Tier)

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Copy the key to `GEMINI_API_KEY`

**Free Tier Limits**:
- 15 requests per minute
- 1,500 requests per day
- 1 million tokens per minute

**Paid Tier**: [Google AI Pricing](https://ai.google.dev/pricing)

### 2. OpenRouter API

1. Go to [OpenRouter](https://openrouter.ai/)
2. Sign up and get your API key from [Settings](https://openrouter.ai/settings/keys)
3. Copy the key to `OPENROUTER_API_KEY`

**Free Models** (rate-limited):
- `google/gemini-2.0-flash-exp:free`
- `meta-llama/llama-3.3-8b-instruct:free`
- `mistralai/mistral-7b-instruct:free`
- `qwen/qwen-2-7b-instruct:free`

**Paid Models** (faster, no rate limits):
- `google/gemini-flash-1.5-8b` ($0.075 / 1M tokens)
- `anthropic/claude-3-haiku` ($0.25 / 1M tokens)
- `meta-llama/llama-3.1-8b-instruct` ($0.06 / 1M tokens)

---

## How the Fallback System Works

1. **First Try**: OpenRouter (fastest)
   - Tries models in order of priority (paid → free)
   - 15 second timeout per model
   - If rate-limited or fails, tries next model

2. **Second Try**: Google Gemini
   - Only if all OpenRouter models fail
   - Uses available Gemini keys with rate limit tracking

3. **Rate Limit Handling**:
   - Keys/models that hit rate limits are temporarily blacklisted
   - Retry delay is extracted from error responses
   - System automatically rotates to next available key/model

---

## Performance Tips

### Speed Optimization

1. **Use Multiple Keys**: Add 3-5 keys for each provider to distribute load
2. **Prefer Paid Tiers**: Much faster with no rate limits
3. **OpenRouter Credits**: Add $5-10 credits to OpenRouter for instant responses

### Cost Optimization

1. **Mix Free & Paid**: Use free models for simple tasks, paid for complex
2. **Monitor Usage**: Check [Google AI Usage](https://ai.dev/usage) and [OpenRouter Usage](https://openrouter.ai/activity)

---

## Model Priority (Current Configuration)

**OpenRouter Models** (in order):
1. `google/gemini-flash-1.5-8b` (paid, fast)
2. `anthropic/claude-3-haiku` (paid, high quality)
3. `meta-llama/llama-3.1-8b-instruct` (paid, fast)
4. `google/gemini-2.0-flash-exp:free` (free, rate-limited)
5. `meta-llama/llama-3.3-8b-instruct:free` (free, rate-limited)
6. `mistralai/mistral-7b-instruct:free` (free, rate-limited)
7. `qwen/qwen-2-7b-instruct:free` (free, rate-limited)

**Gemini Models** (fallback):
1. `gemini-2.0-flash`
2. `gemini-2.0-flash-lite`

---

## Troubleshooting

### Error: "429 Too Many Requests"

**Cause**: API quota exhausted

**Solutions**:
1. Wait 24 hours for quota reset (free tier)
2. Add more API keys (multiple keys = more quota)
3. Upgrade to paid tier
4. Add OpenRouter credits

### Error: "All AI attempts failed"

**Cause**: All keys rate-limited or invalid

**Solutions**:
1. Check API keys are valid
2. Wait for rate limit reset (check error message for retry time)
3. Add more provider keys
4. Check internet connection

### Slow Responses (>30 seconds)

**Causes**:
1. All fast models rate-limited, falling back to slow models
2. Network latency
3. Large context (many elements on canvas)

**Solutions**:
1. Add paid tier keys for instant responses
2. Reduce canvas complexity
3. Clear old conversations

### Images Not Persisting After Refresh

**Fixed in latest version**. If issue persists:
1. Clear browser cache
2. Check console for errors
3. Verify Cloudinary is configured

---

## Testing the Setup

After adding keys, test with these prompts:

1. **Basic**: "Add a blue circle in the center"
2. **Image**: "Add a cat photo to the top-left"
3. **Complex**: "Create a poster with gradient background and headline"

Check console logs to see which provider/model was used:
```
✓ Success with openrouter:google/gemini-flash-1.5-8b
```

---

## Cost Estimates

### Free Tier (Current Setup)
- **Gemini**: 1,500 requests/day
- **OpenRouter Free Models**: Limited, shared quota
- **Monthly Cost**: $0
- **Expected**: Frequent rate limits during active use

### Light Usage (~100 AI requests/day)
- **Setup**: 1 Gemini paid key OR $5 OpenRouter credits
- **Monthly Cost**: ~$2-5
- **Expected**: Fast, reliable responses

### Heavy Usage (~1,000 AI requests/day)
- **Setup**: Multiple paid keys + OpenRouter credits
- **Monthly Cost**: ~$20-50
- **Expected**: Instant responses, no rate limits

---

## Need Help?

1. Check [Google AI Docs](https://ai.google.dev/docs)
2. Check [OpenRouter Docs](https://openrouter.ai/docs)
3. Monitor usage:
   - Gemini: https://ai.dev/usage
   - OpenRouter: https://openrouter.ai/activity

---

## Recent Changes

- ✅ Added OpenRouter fallback with 7 models
- ✅ Implemented sequential model trying (fast fail)
- ✅ Added 15s timeout per model
- ✅ Fixed image attachment persistence
- ✅ Added chain-of-thought UI for tool execution
- ✅ Increased API timeouts (90s default, 120s for AI)
- ✅ Fixed dark mode gradient styling
