// D2 (MOBILE-GRAPHICS-DIET) — the grading fold: tonemap + grade run as ONE fused
// full-screen pass (OutputGradePass) by default; ?gradefold=0 restores the shipped
// OutputPass → GradingShader two-pass chain (the A/B / refutation control).
// Checks: (1) source guards — shared grade GLSL used verbatim by BOTH paths, the
// CUSTOM_TONE_MAPPING branch present in the fused encode (the N3 trap: omit it and
// ?tm=neutral silently ships untonemapped), per-tap encode for CA parity;
// (2) functional — pass census in both modes, grade uniforms owned by
// postfx.gradingPass either way; (3) PIXEL IDENTITY — the same frozen frame rendered
// through both chains must match within 1 8-bit LSB (the only physical difference is
// the removed intermediate HalfFloat RT round-trip, a sub-LSB quantize).
//   node tests/gradefold.mjs
import { readFileSync } from 'fs';
import { boot, check } from './browser.mjs';

const post = readFileSync(new URL('../js/postfx.js', import.meta.url), 'utf8');

// --- 1. source guards ---------------------------------------------------------
check('fold seam wired (?gradefold=0 restores the shipped two-pass chain)',
  post.includes("get('gradefold') === '0'"));
check('shared grade GLSL: PARS block used by BOTH fragments',
  (post.match(/\$\{GRADING_PARS_GLSL\}/g) || []).length === 2);
check('shared grade GLSL: CA head used by BOTH fragments',
  (post.match(/\$\{GRADING_CA_GLSL\}/g) || []).length === 2);
check('shared grade GLSL: grade body used by BOTH fragments (fold = pass-count change, never a math change)',
  (post.match(/\$\{GRADING_MATH_GLSL\}/g) || []).length === 2);
check('fused encode has the CUSTOM_TONE_MAPPING branch (N3: ?tm=neutral must not ship untonemapped)',
  post.includes('#elif defined( CUSTOM_TONE_MAPPING )') && /c = CustomToneMapping\( c \);/.test(post));
check('fused encode has the sRGB transfer tail', post.includes('sRGBTransferOETF( vec4( c, 1.0 ) )'));
check('fused pass tonemaps EACH chromatic-aberration tap (byte-target parity with sampling the old intermediate RT)',
  (post.match(/outputEncode\( texture2D\( tDiffuse/g) || []).length === 3);
check('fused pass rebuilds defines off the LIVE renderer tonemap/colorspace (?tm= flips live)',
  post.includes('this._toneMapping !== renderer.toneMapping') && post.includes('this.material.needsUpdate = true'));

// --- 2. functional: default boot = fused chain --------------------------------
{
  const { page, errors, done } = await boot();
  const s = await page.evaluate(() => {
    const pf = window.__dd.postfx.handle;
    const passes = pf.composer.passes;
    const last = passes[passes.length - 1];
    return {
      folded: pf.gradeFolded,
      count: passes.length,
      lastName: last.material.name,
      lastIsGradingPass: pf.gradingPass === last,
      hasGradeUniforms: !!(last.uniforms.uDither && last.uniforms.saturation && last.uniforms.liftTint),
      hasExposure: !!last.uniforms.toneMappingExposure,
    };
  });
  check('default: gradeFolded = true', s.folded === true);
  check('default: 4 passes (Render → bloom → god-rays → fused output+grade), one fewer than shipped', s.count === 4);
  check('default: last pass is the fused OutputGradeShader', s.lastName === 'OutputGradeShader');
  check('default: postfx.gradingPass IS the fused pass (setDither/updatePostFX drive it unchanged)', s.lastIsGradingPass);
  check('default: fused pass owns grade + exposure uniforms', s.hasGradeUniforms && s.hasExposure);

  // --- 3. pixel identity: same frozen frame through both chains ---------------
  // Freeze the RAF loop, then manually render the SAME scene state through the
  // fused chain and the rebuilt two-pass chain; capture via toDataURL in-task.
  await page.evaluate(() => { window.requestAnimationFrame = () => 0; });
  await page.waitForTimeout(150);   // let the last scheduled real frame drain
  const diff = await page.evaluate(async () => {
    const pf = window.__dd.postfx.handle;
    const renderer = window.__dd.renderer;
    const c = pf.composer;
    const shot = () => { c.render(); return renderer.domElement.toDataURL('image/png'); };
    const a = shot();   // fused
    const { OutputPass } = await import('./lib/postprocessing/OutputPass.js');
    const { ShaderPass } = await import('./lib/postprocessing/ShaderPass.js');
    const { GradingShader } = await import('./js/postfx.js');
    const fused = c.passes[c.passes.length - 1];
    c.removePass(fused);
    c.addPass(new OutputPass());
    const grad = new ShaderPass(GradingShader);
    c.addPass(grad);
    for (const k of ['saturation', 'vibrance', 'contrast', 'vignette', 'aberration', 'lift', 'uDither']) {
      grad.uniforms[k].value = fused.uniforms[k].value;
    }
    grad.uniforms.liftTint.value.copy(fused.uniforms.liftTint.value);
    const b = shot();   // split (shipped chain)
    const load = (d) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = d; });
    const [ia, ib] = await Promise.all([load(a), load(b)]);
    const cv = document.createElement('canvas'); cv.width = ia.width; cv.height = ia.height;
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(ia, 0, 0); const da = ctx.getImageData(0, 0, cv.width, cv.height).data;
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.drawImage(ib, 0, 0); const db = ctx.getImageData(0, 0, cv.width, cv.height).data;
    let max = 0, nDiff = 0;
    for (let i = 0; i < da.length; i += 4) {
      const m = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2]));
      if (m > 0) nDiff++;
      if (m > max) max = m;
    }
    return { max, diffFrac: nDiff / (da.length / 4), w: cv.width, h: cv.height };
  });
  console.log(`  (pixel A/B fused vs split: ${diff.w}x${diff.h}, maxΔ=${diff.max}/255, differing=${(diff.diffFrac * 100).toFixed(2)}%)`);
  check('pixel identity: fused vs split within 1 LSB (the removed RT round-trip is the only physical difference)', diff.max <= 1);
  check('pixel identity: overwhelming majority of pixels byte-identical', diff.diffFrac < 0.35);
  check('no console errors (default boot)', errors.length === 0);
  await done();
}

// --- 4. functional: ?gradefold=0 = the shipped two-pass chain ------------------
{
  const { page, errors, done } = await boot({ query: '?debug&gradefold=0' });
  const s = await page.evaluate(() => {
    const pf = window.__dd.postfx.handle;
    const passes = pf.composer.passes;
    return {
      folded: pf.gradeFolded,
      count: passes.length,
      outName: passes[3].material.name,
      lastIsGradingPass: pf.gradingPass === passes[passes.length - 1],
      hasDither: !!pf.gradingPass.uniforms.uDither,
    };
  });
  check('?gradefold=0: gradeFolded = false', s.folded === false);
  check('?gradefold=0: 5 passes (the shipped chain restored)', s.count === 5);
  check('?gradefold=0: pass 4 is the vendored OutputShader', s.outName === 'OutputShader');
  check('?gradefold=0: postfx.gradingPass is the split grading pass (uDither reachable)', s.lastIsGradingPass && s.hasDither);
  check('no console errors (?gradefold=0 boot)', errors.length === 0);
  await done();
}
