$(() => {
    const video = document.getElementById('user-video');
    const faceDescriptors = [];
    const registrationSteps = [
        {
            step: 'Step 1: Face on front then click capture',
            example_src: '/images/face-positions/front.png'
        },
        {
            step: 'Step 2: Slightly face on the left then click capture',
            example_src: '/images/face-positions/left.png'
        },
        {
            step: 'Step 3: Slightly face on the right then click capture',
            example_src: '/images/face-positions/right.png'
        },
        {
            step: 'Step 4: Slightly face up then click capture',
            example_src: '/images/face-positions/up.png'
        },
        {
            step: 'Step 5: Slightly face down then click capture',
            example_src: '/images/face-positions/down.png'
        },
    ];
    let canvas;
    let detectionInterval;
    let getSnapshot = null;
    let registerReady = false;
    
    const frCls = {
        get bgGray() {return `bg-gray-500`},
        get bgBlue() {return `bg-blue-500`},
        get bgGreen() {return `bg-green-500`},
        get bgYellow() {return `bg-yellow-300`},
        get bgWhite() {return `bg-white`},
    };
    const frSel = {
        get registerBtn() {return `button.register`},
        get testBtn() {return `button.test`},
        get recognitionWrapperCont() {return `div.recognition`},
        get waitCont() {return `.wait`},
    };
    const device = new MobileDetect(window.navigator.userAgent);
    
    $(function init() {
        window.c.loadingModalAlert('Loading');

        if (device.mobile()) {
            $(frSel.recognitionWrapperCont).html(`
                <div class="w-full h-full flex justify-center items-center">
                    <span>This feature is not supported on mobile.</span>
                </div>
            `);
            Swal.close();
            return;
        }
    
        const loadModels = new Promise((resolve, reject) => {
            Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri('public/js/face-api/models'),
                faceapi.nets.faceExpressionNet.loadFromUri('public/js/face-api/models'),
                faceapi.nets.faceRecognitionNet.loadFromUri('public/js/face-api/models'),
                faceapi.nets.faceLandmark68Net.loadFromUri('public/js/face-api/models'),
                faceapi.nets.ssdMobilenetv1.loadFromUri('public/js/face-api/models'),
            ]).then(() => {
                startVideo();
                resolve();
            }).catch(() => {
                changeBgColor(frSel.recognitionWrapperCont, frCls.bgGray);
                $(frSel.recognitionWrapperCont).html(`
                    <div class="w-full h-full flex justify-center items-center text-white text-lg">
                        <span>Something went wrong. Please, reload the page.</span>
                    </div>
                `);
                reject();
            });
        });
        
        const registrationStatus = new Promise((resolve, reject) => {
            console.log('register user');
            resolve();
            
            // fetch("/api/face-recognition/face", window.c.getMethod).then(response => {
            //     if (response.ok) {
            //         response.text().then((data) => {
            //             if (data) {
            //                 $(frSel.registerBtn).html(`
            //                     <div>
            //                         <div><small>If you experience issues,</small></div>
            //                         <div><small>click here</small></div>
            //                         <div><small>to register again</small></div>
            //                     </div>
            //                 `);
            //             } else {
            //                 $(frSel.registerBtn).html('Register');
            //             }
            //             resolve();
            //         });
            //     } else {
            //         throw response.statusText + ' ' + response.status;
            //     }
            // }).catch(err => {
            //     window.c.errorNotif(frSel.recognitionWrapperCont, 'Something went wrong')
            // });
        });
    
        Promise.allSettled([loadModels, registrationStatus])
            .then(() => {
                Swal.close();
                $(frSel.waitCont).removeClass('hidden');
            });
    });
    
    $.notify.addStyle('registration', {
        html: 
            "<div class='notifyjs-container'>" +
                "<div class='notifyjs-bootstrap-base notifyjs-bootstrap-info shadow-xl'>" +
                    "<div class='flex flex-row justify-between'/>" +
                        "<div class='flex justify-center items-center text-center w-full' style='white-space: normal !important'>"+
                            "<span class='align-middle' data-notify-html='step'></span>"+
                        "</div>" +
                        "<button class='show p-2 m-2 bg-blue-600 text-white w-32 h-10 rounded-xl'>Show Example</button>" +
                    "</div>" +
                "</div>" +
            "</div>",
        classes: {
            base: {
                'width': '500px',
                'background': '#D9EDF7',
                'padding': '5px',
                'border-radius': '10px',
                'box-shadow' : '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)',
            }
        },
    });
    
    function showRegistrationSteps(element, stepNum) {
        if (stepNum >= registrationSteps.length) return;
        const procedure = registrationSteps[stepNum];
        const example_src = procedure.example_src;
    
        $(element).notify({step: procedure.step}, { 
            style: 'registration',
            autoHide: false,
            clickToHide: false,
            position: 'top center'
        });
    
        $(document).on('click', '.notifyjs-registration-base .show', function() {
            Swal.fire({
                html: '<i>Follow the position of the face.</i>',
                imageUrl: example_src,
                imageWidth: 500,
                imageHeight: 500,
            });
        });
    
        disabledRegisterButton(false, frCls.bgGreen);
        $(frSel.registerBtn).html('Capture');
    }
    
    function changeBgColor(element, color) {
        const prefix = "bg-";
        const classes = $(element)[0].className.split(" ").filter(c => !c.startsWith(prefix));
        $(element)[0].className = classes.join(" ").trim();
        $(element).addClass(color);
    }
    
    async function takeSnapshot(singleDetection) {
        const dscrptrs = singleDetection?.descriptor;
        if (!dscrptrs) {
            window.c.errorNotif(frSel.registerBtn, 'Please make sure your image is clear!');
            return;
        }
        window.c.loadingModalAlert('Processing');
        faceDescriptors.push(dscrptrs);
        const requestJson = JSON.stringify({ descriptors: faceDescriptors });
        fetch("/api/face-recognition/save-face-descriptors", {
            ...window.c.postMethod,
            body: requestJson
        }).then(response => {
            if (response.ok) {
                response.json().then((json) => {
                    successRegistration();
                })
            } else {
                throw response.statusText + ' ' + response.status;
            }
        }).catch(err => {
            window.c.errorNotif(frSel.registerBtn, 'Something went wrong');
            window.c.failedModalAlert('Registration Failed!');
            setTimeout(() => location.reload(), 2000);
        });
    }
    
    function startVideo() {
        if (navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(function (stream) {
                    video.srcObject = stream;
                    detectVideo();
                })
                .catch(function (error) {
                    console.log("Something went wrong!");
                });
        }
    }
    
    function pauseVideo() {
        getSnapshot = null;
        $(video).off();
        clearInterval(detectionInterval);
        canvas.remove();
        video.pause();
    }
    
    function playVideo() {
        video.play();
        detectVideo();
        disabledRegisterButton(false);
    }
    
    function stopVideo() {
        video.srcObject.getTracks().forEach(function(track) {
            track.stop();
        });
        video.srcObject = null;
    }
    
    function successRegistration() {
        window.c.successModalAlert('Done!');
        stopVideo();
        if (canvas) canvas.remove()
        changeBgColor(frSel.waitCont, frCls.bgWhite);
        $(frSel.waitCont).html(`
            <div class="w-full h-full flex justify-center items-center text-center text-lg text-black font-normal">
                <span>Your registration is successful. You can register again if you experience issues regarding Face Recognition.</span>
            </div>
        `);
        $(frSel.waitCont).removeClass('hidden');
        disabledRegisterButton(true, frCls.bgGray);
        $(frSel.registerBtn).html('Register');
    }
    
    function disabledRegisterButton(isDisabled, bgColor = null) {
        $(frSel.registerBtn).prop('disabled', isDisabled);
        if (isDisabled) {
            changeBgColor(frSel.registerBtn, bgColor ? bgColor : frCls.bgGray);
        } else {
            changeBgColor(frSel.registerBtn, bgColor ? bgColor : frCls.bgBlue);
        }
    }
    
    function detectVideo() {
        $(video).on('playing', async() => {
            // const detectionOptions = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.8 });
            const detectionOptions = new faceapi.TinyFaceDetectorOptions({ inputSize: 320 });
            
            if (canvas) canvas.remove()
            const displaySize = { width: video.width, height: video.height };
            canvas = faceapi.createCanvas(displaySize);
            const context2d = canvas.getContext('2d');
            $('.face-recognition.register div.recognition').append(canvas);
    
            // draw face detections
            detectionInterval = setInterval(async () => {
                const detections = await faceapi.detectSingleFace(video, detectionOptions)
                    .withFaceLandmarks()
                    .withFaceDescriptor();
                const resizedDetections = faceapi.resizeResults(detections, displaySize);
                context2d.clearRect(0, 0, canvas.width, canvas.height);
                faceapi.draw.drawDetections(canvas, resizedDetections);
                faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
                if (getSnapshot) {
                    getSnapshot = false;
                    takeSnapshot(detections);
                }
                // enable register button
                const registerButtonIsDisabled = $(frSel.registerBtn).attr('disabled');
                if (!registerReady && registerButtonIsDisabled) {
                    registerReady = true;
                    $(frSel.waitCont).addClass('hidden');
                    disabledRegisterButton(false);
                }
            }, 100);
            getSnapshot = false;
        });
    }
    
    $(document).on('click', frSel.registerBtn, function () {
        if (getSnapshot !== null) {
            disabledRegisterButton(true, frCls.bgYellow);
            $(frSel.registerBtn).html(`
                <div class="spinner-grow" style="width: 1rem; height: 1rem;" role="status">
                    <span class="sr-only">Loading...</span>
                </div>
            `);
            setTimeout(() => {
                getSnapshot = true;
            }, 1500);
        } 
    });
    
});