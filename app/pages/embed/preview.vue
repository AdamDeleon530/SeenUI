<script setup lang="ts">
definePageMeta({ layout: false })

const q = useRoute().query
const mode        = (q.mode    as string) || 'inline'
const primary     = (q.color   as string) || '#6172f3'
const buttonText  = (q.text    as string) || 'Book a Consultation'
const heading     = (q.heading as string) || 'Request an Appointment'
const subheading  = (q.sub     as string) || ''
const placeholder = (q.ph      as string) || 'e.g. Botox, Facial...'
const radius      = (q.radius  as string) || '10'
const font        = (q.font    as string) || 'Inter'
const bg          = (q.bg      as string) || '#ffffff'
const textColor   = (q.tc      as string) || '#111827'
const labelColor  = (q.lc      as string) || '#374151'
const borderColor = (q.bc      as string) || '#d1d5db'

const radiusPx  = `${radius}px`
const fontStack = `${font}, system-ui, sans-serif`

// Google Fonts import if not a system font
const systemFonts = ['Inter', 'Arial', 'Georgia', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana', 'Trebuchet MS']
const fontImport = systemFonts.includes(font)
  ? ''
  : `@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;500;600;700&display=swap');`

useHead({
  htmlAttrs: { lang: 'en' },
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
  ],
  style: [{
    innerHTML: `
      ${fontImport}
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: ${fontStack}; background: #f3f4f6; min-height: 100vh; }
      .wrap { display: flex; align-items: flex-start; justify-content: center; padding: 24px 16px; }
      .mock-page { position: relative; width: 100%; max-width: 600px; background: white; border-radius: 12px; padding: 28px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); overflow: hidden; }
      .dots { display: flex; gap: 5px; margin-bottom: 20px; }
      .dot { width: 10px; height: 10px; border-radius: 50%; background: #e5e7eb; }
      .bar { height: 10px; background: #f3f4f6; border-radius: 4px; margin-bottom: 8px; }
      .bar.s { width: 55%; } .bar.m { width: 80%; }
      /* Widget styles */
      .widget { background: ${bg}; border-radius: calc(${radiusPx} + 6px); padding: 24px; box-shadow: 0 4px 24px rgba(0,0,0,0.10); max-width: 460px; width: 100%; }
      .w-heading { font-size: 17px; font-weight: 700; color: ${textColor}; margin-bottom: 3px; font-family: ${fontStack}; }
      .w-sub { font-size: 13px; color: #6b7280; margin-bottom: 18px; font-family: ${fontStack}; }
      .field { margin-bottom: 12px; }
      .field label { display: block; font-size: 12px; font-weight: 500; color: ${labelColor}; margin-bottom: 4px; font-family: ${fontStack}; }
      .field input, .field select, .field textarea {
        width: 100%; padding: 8px 11px; font-size: 13px;
        border: 1.5px solid ${borderColor}; border-radius: ${radiusPx};
        color: ${textColor}; background: ${bg}; font-family: ${fontStack};
        outline: none;
      }
      .field textarea { resize: none; }
      .req { color: #ef4444; }
      .submit-btn {
        width: 100%; padding: 11px; font-size: 14px; font-weight: 600;
        color: #fff; background: ${primary}; border: none;
        border-radius: ${radiusPx}; margin-top: 4px;
        font-family: ${fontStack}; cursor: default;
      }
    `,
  }],
})
</script>

<template>
  <div>
    <!-- INLINE -->
    <div v-if="mode === 'inline'" class="wrap">
      <div class="widget">
        <div class="w-heading">{{ heading }}</div>
        <div v-if="subheading" class="w-sub">{{ subheading }}</div>
        <div class="field"><label>Full Name <span class="req">*</span></label><input type="text" placeholder="Jane Smith" readonly /></div>
        <div class="field"><label>Email Address <span class="req">*</span></label><input type="email" placeholder="jane@example.com" readonly /></div>
        <div class="field"><label>Phone Number</label><input type="tel" placeholder="+1 (555) 000-0000" readonly /></div>
        <div class="field"><label>Requested Service</label><input type="text" :placeholder="placeholder" readonly /></div>
        <div class="field"><label>Preferred Date</label><input type="date" readonly /></div>
        <div class="field"><label>Additional Notes</label><textarea rows="2" placeholder="Anything else we should know?" readonly /></div>
        <button class="submit-btn">{{ buttonText }}</button>
      </div>
    </div>

    <!-- FLOATING -->
    <div v-else-if="mode === 'floating'" class="wrap">
      <div class="mock-page">
        <div class="dots"><div class="dot" /><div class="dot" /><div class="dot" /></div>
        <p :style="{ fontSize:'17px', fontWeight:'700', color:'#111827', marginBottom:'8px', fontFamily:fontStack }">Your Website</p>
        <p :style="{ fontSize:'13px', color:'#6b7280', marginBottom:'12px', fontFamily:fontStack }">The floating button sticks to the bottom-right corner, giving visitors a persistent way to book.</p>
        <div class="bar m" /><div class="bar" /><div class="bar s" />
        <div
          :style="{
            position:'absolute', bottom:'20px', right:'20px',
            padding:'11px 18px', background: primary, color:'#fff',
            fontSize:'13px', fontWeight:'600', borderRadius:'50px',
            boxShadow:`0 4px 16px ${primary}55`, whiteSpace:'nowrap',
            fontFamily: fontStack,
          }"
        >{{ buttonText }}</div>
      </div>
    </div>

    <!-- MODAL -->
    <div v-else-if="mode === 'modal'" class="wrap">
      <div class="mock-page">
        <div class="dots"><div class="dot" /><div class="dot" /><div class="dot" /></div>
        <p :style="{ fontSize:'17px', fontWeight:'700', color:'#111827', marginBottom:'8px', fontFamily:fontStack }">Your Website</p>
        <p :style="{ fontSize:'13px', color:'#6b7280', marginBottom:'12px', fontFamily:fontStack }">
          Add <code style="font-family:monospace;background:#f3f4f6;padding:1px 5px;border-radius:4px;font-size:11px;">data-lbe-trigger</code> to any button to open the form in a modal.
        </p>
        <div class="bar m" /><div class="bar s" />
        <button :style="{ marginTop:'14px', padding:'10px 20px', background:primary, color:'#fff', fontSize:'13px', fontWeight:'600', border:'none', borderRadius:radiusPx, fontFamily:fontStack }">
          {{ buttonText }}
        </button>

        <!-- Modal overlay -->
        <div style="position:absolute;inset:0;background:rgba(0,0,0,0.45);backdrop-filter:blur(3px);border-radius:12px;display:flex;align-items:center;justify-content:center;padding:16px;">
          <div :style="{ background:bg, borderRadius:`calc(${radiusPx} + 4px)`, padding:'22px', width:'100%', maxWidth:'320px', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }">
            <p :style="{ fontSize:'15px', fontWeight:'700', color:textColor, marginBottom:'3px', fontFamily:fontStack }">{{ heading }}</p>
            <p :style="{ fontSize:'12px', color:'#6b7280', marginBottom:'14px', fontFamily:fontStack }">
              {{ subheading || "Fill in your details and we'll be in touch." }}
            </p>
            <div :style="{ height:'32px', background:borderColor + '55', borderRadius:radiusPx, marginBottom:'8px' }" />
            <div :style="{ height:'32px', background:borderColor + '55', borderRadius:radiusPx, marginBottom:'8px' }" />
            <div :style="{ height:'32px', background:borderColor + '55', borderRadius:radiusPx, marginBottom:'12px' }" />
            <div :style="{ height:'38px', background:primary, borderRadius:radiusPx }" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
