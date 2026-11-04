/*
 * Hero background, drawn entirely in a WebGL shader (three.js) — no picture.
 * A near-black field in the site palette with a few thin cream circles that all touch one
 * centre point, stacked above it and mirrored below it, with a soft cream glow where they meet.
 * The circles keep blooming outward from the centre, and film grain moves on top.
 * Scrolling zooms into the centre; the pointer nudges it a little.
 * Without WebGL (or with reduced motion) a still CSS gradient shows instead.
 */
(() => {
  const canvas = document.getElementById("heroGL");
  const hero = document.querySelector(".hero");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!canvas || !hero || !window.THREE || reduced) return;

  const SPEED = 1; // how fast the petals bloom outward (0 = frozen)
  const GRAIN = 0.06; // strength of the film grain
  const THICKNESS = 0.003; // half-width of each circle's line, as a fraction of the hero height
  const BLUR = 2.2; // how far the glow spreads either side of each line (1 = tight)

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "low-power" });
  } catch (err) {
    return; // no WebGL: keep the CSS gradient
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      view: { value: new THREE.Vector2(1, 1) },
      pointer: { value: new THREE.Vector2() },
      time: { value: 0 },
      scroll: { value: 0 },
      grain: { value: GRAIN },
      thickness: { value: THICKNESS },
      blur: { value: BLUR },
    },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
    fragmentShader: `
      uniform vec2 view; uniform vec2 pointer; uniform float time; uniform float scroll; uniform float grain; uniform float thickness; uniform float blur;
      varying vec2 vUv;
      float rand(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      // Smooth value noise, layered (fbm), for a soft paper-like texture.
      float noise(vec2 p){
        vec2 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(rand(i), rand(i + vec2(1.0, 0.0)), f.x),
                   mix(rand(i + vec2(0.0, 1.0)), rand(i + vec2(1.0, 1.0)), f.x), f.y);
      }
      float fbm(vec2 p){
        float v = 0.0, a = 0.5;
        for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.1; a *= 0.5; }
        return v;
      }

      // Light from one circle's edge: a solid line of width 2 * thickness, then a soft glow
      // spreading inward and a quick fall-off outside.
      float rim(vec2 p, vec2 c, float r){
        float d = length(p - c) - r;
        d = sign(d) * max(abs(d) - thickness, 0.0);
        return d < 0.0 ? exp(d / (0.035 * blur)) : exp(-d / (0.018 * blur));
      }

      void main(){
        float aspect = view.x / view.y;
        vec2 p = (vUv - 0.5 - pointer * 0.015) * vec2(aspect, 1.0);
        p *= 1.0 - scroll * 0.55;

        const int RINGS = 5;
        float top = 0.0;
        float bottom = 0.0;
        for (int i = 0; i < RINGS; i++) {
          // Each circle grows from the centre to off-screen, then starts again: an endless bloom.
          float ph = fract(float(i) / float(RINGS) + time * 0.03);
          float R = 0.05 * exp(ph * 3.0);
          float fade = smoothstep(0.0, 0.2, ph) * (1.0 - smoothstep(0.65, 1.0, ph));
          top += rim(p, vec2(0.0, R), R) * fade;
          bottom += rim(p, vec2(0.0, -R), R) * fade;
        }
        top = 1.0 - exp(-top * 0.6);
        bottom = 1.0 - exp(-bottom * 0.6);

        // Site palette (styles.css): ink black and cream only.
        vec3 ink = vec3(0.047, 0.047, 0.043);   // #0c0c0b
        vec3 cream = vec3(0.925, 0.910, 0.875); // #ece8df

        // Base: near-black, faintly warm toward the middle, with a faint cream haze on the horizon.
        float r = length(p);
        vec3 col = mix(ink, vec3(0.10, 0.09, 0.075), exp(-r * 1.6));
        col = mix(col, cream, exp(-abs(p.y) * 12.0) * 0.06);

        // Thin cream lines, dimmer below; a soft cream glow where they meet.
        col = mix(col, cream, top * 0.6);
        col = mix(col, cream, bottom * 0.3);
        col = mix(col, cream, exp(-r * 9.0) * 0.4);

        // Texture: slow-drifting mottled noise, then fine moving grain on top.
        float tex = fbm(p * 6.0 + vec2(time * 0.02, -time * 0.015));
        col *= 0.9 + 0.2 * tex;
        col += (rand(gl_FragCoord.xy + fract(time) * 100.0) - 0.5) * grain;
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const scene = new THREE.Scene();
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  function resize() {
    renderer.setSize(hero.clientWidth, hero.clientHeight, false);
    material.uniforms.view.value.set(hero.clientWidth, hero.clientHeight);
  }
  resize();
  addEventListener("resize", resize);
  hero.classList.add("has-gl");

  const pointer = { x: 0, y: 0 };
  const eased = { x: 0, y: 0, scroll: 0 };
  addEventListener("pointermove", (e) => {
    pointer.x = e.clientX / innerWidth - 0.5;
    pointer.y = 0.5 - e.clientY / innerHeight;
  }, { passive: true });

  // Only render while the hero is on screen.
  let visible = true;
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(hero);

  const clock = new THREE.Clock();
  function frame() {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    eased.x += (pointer.x - eased.x) * 0.04;
    eased.y += (pointer.y - eased.y) * 0.04;
    eased.scroll += (Math.min(scrollY / hero.offsetHeight, 1) - eased.scroll) * 0.08;

    const u = material.uniforms;
    u.time.value = clock.getElapsedTime() * SPEED;
    u.pointer.value.set(eased.x, eased.y);
    u.scroll.value = eased.scroll;
    renderer.render(scene, camera);
  }
  frame();
})();
