// D2 (MOBILE-GRAPHICS-DIET) — the grading fold: tonemap + grade run as ONE fused
// full-screen pass (OutputGradePass) by default; ?gradefold=0 restores the shipped
// OutputPass → GradingShader two-pass chain (the A/B / refutation control).
// Checks: (1) source guards — shared grade GLSL used verbatim by BOTH paths, the
// CUSTOM_TONE_MAPPING branch present in the fused encode (the N3 trap: omit it and
// ?tm=neutral silently ships untonemapped), per-tap encode;
// (2) functional — pass census in both modes, grade uniforms owned by
// postfx.gradingPass either way; (3) PIXEL A/B — the same frozen frame through both
// chains, at TWO aberration values (the Gate-2 correction): at ab 0 they match within
// 1 LSB (removed HalfFloat-RT quantize is the only diff); at ab 0.025 (surge-class)
// the fold's filter→encode diverges from the old encode→filter on glint edges — a
// justified, edge-local deviation the guard now PINS (>8-LSB <1%, meanΔ <1 LSB)
// instead of dodging by only ever sampling ab≈0.
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
check('shared grade GLSL: grade body used VERBATIM by BOTH fragments (the A/B control can\'t drift)',
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
  // Diff the SAME frozen frame through the fused chain vs the rebuilt two-pass chain
  // at a PINNED aberration (both paths get the same value), so we can pin BOTH the
  // exact-at-0 identity AND the CA-active deviation envelope (the Gate-2 finding: the
  // old chain filtered the encoded intermediate, the fold filters linear HDR then
  // encodes — divergent on glint edges once CA is on).
  const abDiff = (ab) => page.evaluate(async (ab) => {
    const pf = window.__dd.postfx.handle, renderer = window.__dd.renderer, c = pf.composer;
    const { OutputPass } = await import('./lib/postprocessing/OutputPass.js');
    const { ShaderPass } = await import('./lib/postprocessing/ShaderPass.js');
    const { GradingShader } = await import('./js/postfx.js');
    // Ensure the fused pass is last (restore after a prior split rebuild), pin its uniforms.
    let fused = c.passes[c.passes.length - 1];
    if (fused.material.name !== 'OutputGradeShader') { fused = pf.gradingPass; }
    const GRADE = ['saturation', 'vibrance', 'contrast', 'vignette', 'aberration', 'lift', 'uDither'];
    const shot = () => { c.render(); return renderer.domElement.toDataURL('image/png'); };
    fused.uniforms.aberration.value = ab;
    const a = shot();   // fused
    c.removePass(fused);
    c.addPass(new OutputPass());
    const grad = new ShaderPass(GradingShader);
    c.addPass(grad);
    for (const k of GRADE) grad.uniforms[k].value = fused.uniforms[k].value;
    grad.uniforms.liftTint.value.copy(fused.uniforms.liftTint.value);
    grad.uniforms.aberration.value = ab;
    const b = shot();   // split (shipped chain)
    const load = (d) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = d; });
    const [ia, ib] = await Promise.all([load(a), load(b)]);
    const cv = document.createElement('canvas'); cv.width = ia.width; cv.height = ia.height;
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(ia, 0, 0); const da = ctx.getImageData(0, 0, cv.width, cv.height).data;
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.drawImage(ib, 0, 0); const db = ctx.getImageData(0, 0, cv.width, cv.height).data;
    let max = 0, nDiff = 0, n8 = 0, sum = 0; const N = da.length / 4;
    for (let i = 0; i < da.length; i += 4) {
      const dr = Math.abs(da[i] - db[i]), dg = Math.abs(da[i + 1] - db[i + 1]), dbb = Math.abs(da[i + 2] - db[i + 2]);
      const m = Math.max(dr, dg, dbb);
      if (m > 0) nDiff++;
      if (m > 8) n8++;
      if (m > max) max = m;
      sum += (dr + dg + dbb) / 3;
    }
    // Restore the fused pass as the last pass for the next call.
    c.removePass(c.passes[c.passes.length - 1]);
    c.removePass(c.passes[c.passes.length - 1]);
    c.addPass(fused);
    return { max, diffFrac: nDiff / N, frac8: n8 / N, meanAbs: sum / N, w: cv.width, h: cv.height };
  }, ab);

  // (a) aberration OFF → exact identity (≤1 LSB, the removed-quantize residual). This is
  // the whole tier-1 mobile-diet audience (CA is tier-0-only) + all low-speed play.
  const d0 = await abDiff(0);
  console.log(`  (A/B ab=0: ${d0.w}x${d0.h}, maxΔ=${d0.max}/255, differing=${(d0.diffFrac * 100).toFixed(2)}%)`);
  check('pixel identity @ aberration 0: fused vs split ≤ 1 LSB (removed RT quantize is the only diff)', d0.max <= 1);
  check('pixel identity @ aberration 0: overwhelming majority byte-identical', d0.diffFrac < 0.35);

  // (b) aberration ON (surge-class 0.025) → the JUSTIFIED CA deviation, envelope-pinned:
  // the fold filters linear HDR then encodes (vs the old encode-then-filter), so glint
  // edges diverge — but only a sliver of pixels, and the guard now COVERS this regime
  // (the earlier freeze-frame probes all had ab≈0 and were blind to it).
  const dCA = await abDiff(0.025);
  console.log(`  (A/B ab=0.025 [surge]: maxΔ=${dCA.max}/255, >8LSB=${(dCA.frac8 * 100).toFixed(2)}%, meanΔ=${dCA.meanAbs.toFixed(3)} LSB)`);
  // The visible divergence (>8 LSB) is confined to a sliver of glint-edge pixels...
  check('CA-active deviation is confined to a sliver of glint-edge pixels (>8-LSB fraction < 1%)', dCA.frac8 < 0.01);
  // ...and it's an EDGE-LOCAL split, NOT a global cast: the average pixel is unchanged
  // (a cast would lift meanΔ; here it stays sub-LSB — the many >1-LSB pixels are the
  // imperceptible ±1-LSB channel micro-shift CA makes across smooth gradients).
  check('CA-active deviation is edge-local, not a global cast (meanΔ < 1 LSB)', dCA.meanAbs < 1.0);
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
