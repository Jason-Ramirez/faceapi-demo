/**
 * Notification
 */
 $.notify.addStyle('custom-confirm', {
    html: 
        "<div class='notifyjs-container'>" +
            "<div class='clearfix notifyjs-bootstrap-base notifyjs-bootstrap-warn shadow-xl'  style='white-space: normal !important; text-align: center !important;'>" +
                "<div class='text-center'/>" +
                    "<span class='text-base'>"+
                        "Are you sure you want to "+
                        "<span data-notify-html='type'></span>?"+
                    "</span>" +
                    "<div class='flex flex-row justify-center mt-3 space-x-2'>" +
                        "<button class='no p-2 bg-gray-400 text-white w-20 rounded-xl'>Cancel</button>" +
                        "<button class='yes p-2 bg-blue-600 text-white w-20 rounded-xl'>Confirm</button>" +
                    "</div>" +
                "</div>" +
            "</div>" +
        "</div>",
    classes: {
        base: {
            'width': '185px',
            'background': '#F5F5F5',
            'padding': '5px',
            'border-radius': '10px',
            'box-shadow' : '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)',
        }
    },
});
$.notify.addStyle('custom-error', {
    html: `
        <div class="notifyjs-container" style="left: 38px; top: -9px;">
            <div class="notifyjs-bootstrap-base notifyjs-bootstrap-error" style='white-space: normal !important; text-align: center !important;'>
                <span data-notify-html />
            </div>
        </div>`,
    classes: {
        base: {
            'border-radius' : '5px',
            'font-size' : '15px',
            'width' : '185px',
        },
    }
});
$(document).on('click', '.notifyjs-custom-confirm-base .no', function() { 
    $(document).off('click', '.notifyjs-custom-confirm-base .yes');
    $(this).trigger('notify-hide'); 
});

const globals = {
    get csrfToken() {return jQuery('meta[name="csrf-token"]').attr('content')},
    get loginToken() {return jQuery('meta[name="login-token"]').attr('content')},
    get xhrHeaders() {return {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'Authorization' : 'Bearer ' + this.loginToken, 
        'X-CSRF-Token': this.csrfToken
    }},
    get postMethod() {return {
        method: "POST",
        credentials: "same-origin",
        headers: this.xhrHeaders,
    }},
    get getMethod() {return {
        method: "GET",
        credentials: "same-origin",
        headers: this.xhrHeaders,
    }},
    errorNotif(element, response) {
        const config = { 
            style: 'custom-error',
            position: 'top center',
            autoHideDelay: 15000,
            arrowSize: 10,
        };
        if (typeof response === 'string') {
            $(element).notify(response, config);
        } else {
            response?.json().then(json => {
                $(element).notify(json.error, config);
            });
        }
    },
    processingNotif(element, position = 'top center') {
        $(element).notify('Processing...', { 
            className: 'info',
            autoHide: false,
            arrowSize: 10,
            position: position,
        });
    },
    confirmNotif(button, type, callback = () => null) {
        $('.notifyjs-custom-confirm-base .no')?.trigger('click');
        $(document).off('click', '.notifyjs-custom-confirm-base .yes');
        $(button).notify({type: type}, { 
            style: 'custom-confirm',
            autoHide: false,
            clickToHide: false,
            position: 'top center'
        });
        // confirm button
        $(document).on('click', '.notifyjs-custom-confirm-base .yes', function() {
            $(this).trigger('notify-hide'); 
            callback();
        });
    },
    infoNotif(element, msg = '', position = 'top center') {
        $(element).notify(msg, { 
            className: 'info',
            autoHide: false,
            arrowSize: 10,
            position: position,
        });
    },

    
    successModalAlert(message = "Success!", timer = 1000, html = false) {
        let msg;
        if (html) msg = message; 
        else msg = `<span class="text-green-500">${message}</span>`;
        Swal.fire({
            position: 'center',
            icon: 'success',
            title: msg,
            showConfirmButton: false,
            timer: timer,
            customClass: {
                popup: 'custom-alert',
                title: 'custom-success-title',
            }
        });
    },
    warningModalAlert(message = "Not Allowed!", timer = 1000) {
        Swal.fire({
            position: 'center',
            icon: 'warning',
            title: `<span>${message}</span>`,
            showConfirmButton: false,
            timer: timer,
            customClass: {
                popup: 'custom-alert',
                title: 'custom-warning-title',
            }
        });
    },
    failedModalAlert(message = "Failed!", timer = 1000) {
        Swal.fire({
            position: 'center',
            icon: 'error',
            title: `<span class="text-red-500">${message}</span>`,
            showConfirmButton: false,
            timer: timer,
            customClass: {
                popup: 'custom-alert',
                title: 'custom-failed-title',
                icon: 'custom-failed-icon',
            }
        });
    },
    loadingModalAlert(message = "Please Wait", timer = null) {
        Swal.fire({
            iconHtml: `
                <div class="spinner-border" style="width: 50px; height: 50px;" role="status">
                    <span class="sr-only">Loading...</span>
                </div>
            `,
            title: message,
            showConfirmButton: false,
            allowOutsideClick: false,
            timer: timer,
            customClass: {
                popup: 'custom-alert',
                title: 'custom-loading-title',
                icon: 'custom-loading-icon',
            }
        });
    },

    loadingContent(element) {
        $(element).html(`
            <div class="spinner-grow" style="width: 1rem; height: 1rem;" role="status">
                <span class="sr-only">Loading...</span>
            </div>
        `);
    }
}

Object.defineProperty( window, "c", {
    value: globals,
    writable: false,
    enumerable: true,
    configurable: true
});

// initialize tool tips
var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-coreui-toggle="tooltip"]'))
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new coreui.Tooltip(tooltipTriggerEl)
})