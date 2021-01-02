var textureNames = ["brick", "dirt", "wall", "floor", "grass"];
var blendModes = ["normal", "add", "subtract", "multiply", "divide"];

var mat = (color) => {
    return new THREE.MeshPhongMaterial({
        color: color
    })
}

var isTopHidden = false;

var hideTop = () => {
    isTopHidden = !isTopHidden;
    if (isTopHidden) {
        document.getElementById("top").style.display = "none";
    } else {
        document.getElementById("top").style.display = "";
    }
}

document.addEventListener("keydown", (event) => {
    switch (event.key) {
        case "h":
        case "H":
            hideTop();
            break;
    }
})

if (!!(new URL(window.location.href)).searchParams.get("hideGui")) hideTop();

var downloadURL = (url, name = "My_Krunker_Shader.zip") => {
    let anchor = document.createElement("a");
    anchor.style = "display: none;";
    anchor.download = name;
    anchor.href = url;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
}

genTexture = (path) => {
    var tex = new THREE.TextureLoader().load(path);
    tex.repeat.set(1, 1);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    return tex
}

var material = {
    black: new THREE.MeshBasicMaterial({
        color: 0x000000
    })
};


var geometry = {
    cube: new THREE.BoxGeometry(),
    plane: new THREE.PlaneGeometry(1, 1, 1),
}

var colorOverlay = new THREE.Color("#000");
var colorOverlayOpac = 0;
var colorOverlayBlend = "normal";

var vigOpac = 0;
var vigRadius = 0.4 // 0.5;
var vigSoftness = 0.25;

var noiseSeed = 0.02;
var noiseOpacity = 0;
var noiseAmount = 0.005;

var genShader = (final = false) => {
    var shader = {
        credits: "Code generated on https://hitthemoney.com/krunker-shader-maker. Made by hitthemoney#1337",
        uniforms: {
            "tDiffuse": {
                value: null
            },
            "colOverlay": {
                value: colorOverlay // `vec3(${colorOverlay.r}, ${colorOverlay.g}, ${colorOverlay.b})`
            },
            "colOverlayOpac": {
                value: colorOverlayOpac
            },
            "colBlend": {
                value: blendModes.indexOf(colorOverlayBlend)
            },
            "vigOpac": {
                value: vigOpac
            },
            "vigRadius": {
                value: vigRadius
            },
            "vigSoftness": {
                value: vigSoftness
            },
            "noiseSeed": {
                value: noiseSeed
            },
            "noiseOpacity": {
                value: noiseOpacity
            },
            "noiseAmount": {
                value: noiseAmount
            }
        },
        fragmentShader: `
// Code generated on https://hitthemoney.com/krunker-shader-maker
// Made by hitthemoney#1337

uniform sampler2D tDiffuse;
${final ? `vec3 colOverlay = vec3(${colorOverlay.r}, ${colorOverlay.g}, ${colorOverlay.b})` : "uniform vec3 colOverlay"};
uniform float colOverlayOpac;
uniform int colBlend;
uniform float vigOpac;
uniform float vigRadius;
uniform float vigSoftness;
uniform float noiseAmount;
uniform float noiseOpacity;
uniform float noiseSeed;
varying vec2 vUv;

float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453); // random
}

vec4 applyVignette(vec4 color) {
    float vignetteScale = 0.65;

    vec2 position = vUv * vignetteScale - vec2(0.5 * vignetteScale);
    float dist = length(position);

    float radius = vigRadius;
    float softness = vigSoftness;
    float vignette = smoothstep(radius, radius - softness, dist);

    color.rgb = mix(color.rgb, color.rgb - (1.0 - (vignette)), vigOpac);

    return color;
}

void main() {
    float xs = floor(gl_FragCoord.x / 0.5);
    float ys = floor(gl_FragCoord.y / 0.5);
    vec4 tex = texture2D(tDiffuse, vec2(vUv.x, vUv.y));
    vec4 tex2 = tex;
    switch (colBlend) {
        case 0:
            tex2.rgb = colOverlay.rgb;
            break;
        case 1:
            tex2.rgb += colOverlay.rgb;
            break;
        case 2:
            tex2.rgb -= colOverlay.rgb;
            break;
        case 3:
            tex2.rgb *= colOverlay.rgb;
            break;
        case 4:
            tex2.rgb /= colOverlay.rgb;
            break;
    }
    tex.rgb = mix(tex.rgb, tex2.rgb, colOverlayOpac);
    vec4 noise = 200.0 * noiseAmount * vec4(rand(vec2(xs * noiseSeed, ys * noiseSeed * 50.0)) * noiseOpacity); // noise texture
    gl_FragColor = applyVignette(tex) + noise;
}

        `,
        vertexShader: `
// Code generated on https://hitthemoney.com/krunker-shader-maker
// Made by hitthemoney#1337

varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
        `
    }
    if (final) {
        shader = JSON.stringify(shader, null, 2);
    }
    return shader;
}

updateShaderPass = () => {
    /*
    var shader = genShader();
    var tId = shaderPass.textureID;
    shader.uniforms[tId].value = shaderPass.uniforms[tId].value;
    shaderPass.material.uniforms = shader.uniforms;
    shaderPass.uniforms = shader.uniforms;
    */
    shaderPass.enabled = false;
    shaderPass = new THREE.ShaderPass(genShader());
    composer.insertPass(shaderPass, 1);
}

var initScene = () => {
    window.scene = new THREE.Scene();
    window.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    camera.far = 6000;
    camera.fov = 90;

    var skyboxCanvas = document.createElement("canvas");
    skyboxCanvas.width = window.innerWidth;
    skyboxCanvas.height = window.innerHeight;
    skyboxCanvas.style.display = "none";
    document.body.appendChild(skyboxCanvas);
    var ctx = skyboxCanvas.getContext("2d")
    var grd = ctx.createLinearGradient(0, 0, 0, skyboxCanvas.height);
    grd.addColorStop(0, "#32e5f9");
    grd.addColorStop(1, "#a5cce1");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, skyboxCanvas.width, skyboxCanvas.height);
    var skyboxTex = new THREE.CanvasTexture(skyboxCanvas);
    scene.background = skyboxTex;

    window.renderer = new THREE.WebGLRenderer({
        alpha: true
    });

    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    window.canvas = renderer.domElement;

    window.composer = new THREE.EffectComposer(renderer);

    window.shaderPass = new THREE.ShaderPass(genShader());
    window.renderPass = new THREE.RenderPass(scene, camera)
    composer.addPass(renderPass);
    composer.addPass(shaderPass);

    window.onresize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        composer.setSize(window.innerWidth, window.innerHeight);
    }

    window.controls = new THREE.OrbitControls(camera, canvas);

    for (i in textureNames) {
        let key = textureNames[i];
        material[key] = new THREE.MeshPhongMaterial({
            map: genTexture(`./assets/img/${key}.png`)
        });
    }

    var cube = new THREE.Mesh(geometry.cube, material.black);
    cube.castShadow = true;
    cube.receiveShadow = true;

    var cubeScale = 1.5;
    var cubeSpacing = 1.5;
    cubeSpacing *= cubeScale;

    var planeScale = new THREE.Vector3(cubeSpacing * textureNames.length /*+ ((cubeSpacing / cubeScale) + 2)*/ , cubeSpacing, 1);

    var posOff = -(planeScale.x / 2) + (cubeSpacing / cubeScale - (cubeSpacing / cubeScale / 4));

    for (i in textureNames) {
        let key = textureNames[i];
        let modifCube = cube.clone();
        modifCube.material = material[key];
        modifCube.position.x = posOff;
        modifCube.scale.set(cubeScale, cubeScale, cubeScale);
        scene.add(modifCube);
        posOff += cubeSpacing;
    }

    var ambLight = new THREE.AmbientLight("#97a0a8");
    scene.add(ambLight);

    var light = new THREE.DirectionalLight(0xf2f8fc, 1.3);
    light.castShadow = true;
    light.receiveShadow = false;
    //light.position.set(3.061616997868383e-14, 404.5084971874737, -293.8926261462366);
    light.position.set(7.5, 10, -5);
    scene.add(light);

    var shadowRes = 1024;

    var lShadow = light.shadow;
    lShadow.mapSize.width = shadowRes;
    lShadow.mapSize.height = shadowRes;


    var planeMat = mat("#aaa");
    planeMat.side = THREE.DoubleSide;
    var plane = new THREE.Mesh(geometry.plane, planeMat);
    scene.add(plane);
    plane.scale.set(planeScale.x, planeScale.y, planeScale.z);
    plane.setRotationFromQuaternion((new THREE.Quaternion()).setFromAxisAngle(new THREE.Vector3(-1, 0, 0), Math.PI / 2))
    plane.position.y = (-cubeScale / 2) - 0.0005;
    plane.castShadow = false;
    plane.receiveShadow = true;
}
initScene();

var initGUI = () => {
    window.gui = new dat.GUI({
        name: "Shader Settings",
        width: 320
    });

    var colorFolder = gui.addFolder("Color");

    var colOverlayParams = {
        color: "#" + colorOverlay.getHexString()
    }

    var colOpacParams = {
        opacity: colorOverlayOpac
    }

    var colBlendsParams = {
        speed: "normal"
    }

    var updateColOverlay = (val, a) => {
        if (!a) {
            colorOverlayOpac = val / 100;
        } else if (a === 1) {
            colorOverlay = new THREE.Color(val);
        } else if (a === 2) {
            colorOverlayBlend = val;
        }

        updateShaderPass();
    };

    colorFolder.addColor(colOverlayParams, "color").onChange((val) => {
        updateColOverlay(val, 1);
    }).name("Color Overlay");

    colorFolder.add(colOpacParams, "opacity", 0, 100).onChange((val) => {
        updateColOverlay(val, 0);
    }).name("Overlay Opacity");

    colorFolder.add(colBlendsParams, "speed", blendModes).name("Blend Mode").onChange((val) => {
        updateColOverlay(val, 2);
    });

    var vignetteFolder = gui.addFolder("Vignette");

    var updateVignette = (val, a) => {
        if (!a) {
            vigOpac = val / 100;
        } else if (a === 1) {
            vigRadius = val / 100;
        } else if (a === 2) {
            vigSoftness = val / 100;
        }

        updateShaderPass();
    };

    var vigOpacParams = {
        opacity: vigOpac
    }

    var vigRadParams = {
        opacity: vigRadius * 100
    }

    var vigSoftnessParams = {
        opacity: vigSoftness * 100
    }

    vignetteFolder.add(vigOpacParams, "opacity", 0, 100).onChange((val) => {
        updateVignette(val, 0);
    }).name("Opacity");

    vignetteFolder.add(vigRadParams, "opacity", 0, 100).onChange((val) => {
        updateVignette(val, 1);
    }).name("Radius");

    vignetteFolder.add(vigSoftnessParams, "opacity", 0, 100).onChange((val) => {
        updateVignette(val, 2);
    }).name("Softness");

    var noiseFolder = gui.addFolder("Noise");

    var updateNoise = (val, a) => {
        if (!a) {
            noiseOpacity = val / 100;
        } else if (a === 1) {
            noiseSeed = val / 100;
        } else if (a === 2) {
            noiseAmount = val / 10000;
        }

        updateShaderPass();
    };

    var noiseOpacParams = {
        opacity: noiseOpacity
    }

    var noiseSeedParams = {
        opacity: noiseSeed * 100
    }

    var noiseAmountParams = {
        opacity: noiseAmount * 10000
    }

    noiseFolder.add(noiseOpacParams, "opacity", 0, 100).onChange((val) => {
        updateNoise(val, 0);
    }).name("Opacity");

    noiseFolder.add(noiseSeedParams, "opacity", 0, 100).onChange((val) => {
        updateNoise(val, 1);
    }).name("Seed");

    noiseFolder.add(noiseAmountParams, "opacity", 0, 100).onChange((val) => {
        updateNoise(val, 2);
    }).name("Amount");

    var exportShader = {
        add: function () {
            var zip = new JSZip();
            zip.file("shaders/shader.json", genShader(true));
            zip.generateAsync({
                    type: "blob"
            })
            .then(function (content) {
                downloadURL(URL.createObjectURL(content));
            });
        }
    };

    gui.add(exportShader, "add").name("Export Shader Mod");
}
initGUI();

var animate = () => {
    requestAnimationFrame(animate);
    composer.render();
}
animate();
