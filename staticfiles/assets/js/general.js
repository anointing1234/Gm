$(document).ready(function () {
    $(".showPassword1").on('click', function () {
        if ($('#pw1').attr("type") === "text") {
            $('#pw1').attr('type', 'password');
            $('.showPassword1').attr("data-bs-original-title", "show password");
            $('#pw1Icon').addClass("fa-eye-slash").removeClass("fa-eye").removeClass("text-success");
        } else if ($('#pw1').attr("type") === "password") {
            $('#pw1').attr('type', 'text');
            $('.showPassword1').attr("data-bs-original-title", "hide password");
            $('#pw1Icon').addClass("fa-eye").removeClass("fa-eye-slash").addClass("text-success");
        }
    });

    $(".showPassword2").on('click', function () {
        if ($('#pw2').attr("type") === "text") {
            $('#pw2').attr('type', 'password');
            $('.showPassword2').attr("data-bs-original-title", "show password");
            $('#pw2Icon').addClass("fa-eye-slash").removeClass("fa-eye").removeClass("text-success");
        } else if ($('#pw2').attr("type") === "password") {
            $('#pw2').attr('type', 'text');
            $('.showPassword2').attr("data-bs-original-title", "hide password");
            $('#pw2Icon').addClass("fa-eye").removeClass("fa-eye-slash").addClass("text-success");
        }
    });

    $(".showNewPassword1").on('click', function () {
        if ($('#npw1').attr("type") === "text") {
            $('#npw1').attr('type', 'password');
            $('.showNewPassword1').attr("data-bs-original-title", "show password");
            $('#npw1Icon').addClass("fa-eye-slash").removeClass("fa-eye").removeClass("text-success");
        } else if ($('#npw1').attr("type") === "password") {
            $('#npw1').attr('type', 'text');
            $('.showNewPassword1').attr("data-bs-original-title", "hide password");
            $('#npw1Icon').addClass("fa-eye").removeClass("fa-eye-slash").addClass("text-success");
        }
    });

    $(".showNewPassword2").on('click', function () {
        if ($('#npw2').attr("type") === "text") {
            $('#npw2').attr('type', 'password');
            $('.showNewPassword2').attr("data-bs-original-title", "show password");
            $('#npw2Icon').addClass("fa-eye-slash").removeClass("fa-eye").removeClass("text-success");
        } else if ($('#npw2').attr("type") === "password") {
            $('#npw2').attr('type', 'text');
            $('.showNewPassword2').attr("data-bs-original-title", "hide password");
            $('#npw2Icon').addClass("fa-eye").removeClass("fa-eye-slash").addClass("text-success");
        }
    });

    $(".showLoginPassword").on('click', function () {
        if ($('#pWord').attr("type") === "text") {
            $('#pWord').attr('type', 'password');
            $('.showLoginPassword').attr("data-bs-original-title", "show password");
            $('#lpIcon').addClass("fa-eye-slash").removeClass("fa-eye").removeClass("text-success");
        } else if ($('#pWord').attr("type") === "password") {
            $('#pWord').attr('type', 'text');
            $('.showLoginPassword').attr("data-bs-original-title", "hide password");
            $('#lpIcon').addClass("fa-eye").removeClass("fa-eye-slash").addClass("text-success");
        }
    });

    $(".showAdminPassword").on('click', function () {
        if ($('#pWordAdmin').attr("type") === "text") {
            $('#pWordAdmin').attr('type', 'password');
            $('.showAdminPassword').attr("data-bs-original-title", "show password");
            $('#adminPasswordIcon').addClass("fa-eye-slash").removeClass("fa-eye").removeClass("text-success");
        } else if ($('#pWordAdmin').attr("type") === "password") {
            $('#pWordAdmin').attr('type', 'text');
            $('.showAdminPassword').attr("data-bs-original-title", "hide password");
            $('#adminPasswordIcon').addClass("fa-eye").removeClass("fa-eye-slash").addClass("text-success");
        }
    });

    $("#accountBalanceEye").on('click', function () {
        if ($('#accountBalance').data("account-balance-visible") === true) {
            $('#accountBalance').data("account-balance-visible", false);
            $('#accountBalance').data("account-balance", $('#accountBalance').text());
            $('#accountBalance').text("******");
            $('#accountBalanceEye').attr("data-bs-original-title", "show account balance");
            $('.accountBalanceEye').addClass("fa-eye-slash").removeClass("fa-eye");
        } else if ($('#accountBalance').data("account-balance-visible") === false) {
            $('#accountBalance').text($('#accountBalance').data("account-balance"));
            $('#accountBalance').data("account-balance-visible", true);
            $('#accountBalanceEye').attr("data-bs-original-title", "hide account balance");
            $('.accountBalanceEye').removeClass("fa-eye-slash").addClass("fa-eye");
        }
    });

    $("#roiEye").on('click', function () {
        if ($('#roi').data("roi-balance-visible") === true) {
            $('#roi').data("roi-balance-visible", false);
            $('#roi').data("roi-balance", $('#roi').text());
            $('#roi').text("******");
            $('#roiEye').attr("data-bs-original-title", "show");
            $('.roiEye').addClass("fa-eye-slash").removeClass("fa-eye");
        } else if ($('#roi').data("roi-balance-visible") === false) {
            $('#roi').text($('#roi').data("roi-balance"));
            $('#roi').data("roi-balance-visible", true);
            $('#roiEye').attr("data-bs-original-title", "hide");
            $('.roiEye').removeClass("fa-eye-slash").addClass("fa-eye");
        }
    });

    $("#totalReturnEye").on('click', function () {
        if ($('#totalReturn').data("total-return-balance-visible") === true) {
            $('#totalReturn').data("total-return-balance-visible", false);
            $('#totalReturn').data("total-return-balance", $('#totalReturn').text());
            $('#totalReturn').text("******");
            $('#totalReturnEye').attr("data-bs-original-title", "show");
            $('.totalReturnEye').addClass("fa-eye-slash").removeClass("fa-eye");
        } else if ($('#totalReturn').data("total-return-balance-visible") === false) {
            $('#totalReturn').text($('#totalReturn').data("total-return-balance"));
            $('#totalReturn').data("total-return-balance-visible", true);
            $('#totalReturnEye').attr("data-bs-original-title", "hide");
            $('.totalReturnEye').removeClass("fa-eye-slash").addClass("fa-eye");
        }
    });

    $("#withdrawalBalanceEye").on('click', function () {
        if ($('#withdrawalBalance').data("withdrawal-balance-visible") === true) {
            $('#withdrawalBalance').data("withdrawal-balance-visible", false);
            $('#withdrawalBalance').data("withdrawal-balance", $('#withdrawalBalance').text());
            $('#withdrawalBalance').text("******");
            $('#withdrawalBalanceEye').attr("data-bs-original-title", "show");
            $('.withdrawalBalanceEye').addClass("fa-eye-slash").removeClass("fa-eye");
        } else if ($('#withdrawalBalance').data("withdrawal-balance-visible") === false) {
            $('#withdrawalBalance').text($('#withdrawalBalance').data("withdrawal-balance"));
            $('#withdrawalBalance').data("withdrawal-balance-visible", true);
            $('#withdrawalBalanceEye').attr("data-bs-original-title", "hide");
            $('.withdrawalBalanceEye').removeClass("fa-eye-slash").addClass("fa-eye");
        }
    });

    $("#userid").text(Math.floor(1000000000 + Math.random() * 9000000000));

    // NO SPACE ACCEPTED
    $("#pw1,#pw2,#fname,#lname,#phone,#email, #signIn #userID, #pWord").on({
        keydown: function (e) {
            if (e.which === 32)
                return false;
        },
        change: function () {
            this.value = this.value.replace(/\s/g, "");
        }
    });

    $("#signIn").submit(function (e) {
        e.preventDefault();
        var jqusername = $("#userID").val().toUpperCase().trim();
        var jqpassword = $("#pWord").val().trim();

        $.ajax({
            async: true,
            url: "assets/php/si.php",
            type: "POST",
            data: {phpusername: jqusername, phppassword: jqpassword}
        }).done(function (return_data) {
            var phpvars = JSON.parse(return_data);
            if (phpvars.status === 'FALSE') {
                $('.login-message').addClass('show');
                $('.login-message').text("THIS ACCOUNT HAS BEEN SUSPENDED...");
                return false;
            }

            if (phpvars.login_valid === true) {
                $("#login").prop('disabled', true);
                location.replace("dashboard/");
            } else if (phpvars.login_valid === false) {
                $('.login-message').addClass('show');
                $('.login-message').text("INVALID CREDENTIALS...");
                return false;
            }
        });
    });

    $("#newPassword").submit(function (e) {
        e.preventDefault();

        if ($('#npw1').val().trim().localeCompare($('#npw2').val().trim()) !== 0) {
            $('#noHeaderToast .toastBody').addClass("bg-danger");
            $('#noHeaderToast .toastIcon').addClass("fa-circle-exclamation");
            $('#noHeaderToast .toastContent').html("Your passwords do not match!");
            $('#noHeaderToast').toast('show');
            return false;
        }

        var jqpassword = $("#npw1").val().trim();

        $.ajax({
            async: true,
            url: "../php/cpw.php",
            type: "POST",
            dataType: "text",
            data: {phppassword: jqpassword}
        }).done(function (return_data) {
            var phpvars = JSON.parse(return_data);

            if (phpvars.invalid_request === true) {
                $("#modalResetError2").modal('show');
                $(".modalTitle").html("Invalid request!");
                $(".modalContent").html("Your request is invalid.");
                $("#modalResetError2 #reDirect").click(function () {
                    location.replace("../index.html");
                })
                return false;
            } else if (phpvars.update_success === true) {
                location.replace("../php/pwc-done.php");
            } else if (phpvars.update_success === false) {
                $("#modalResetError2").modal('show');
                $(".modalTitle").html("Error!");
                $(".modalContent").html("Error while processing your request.");
                $("#modalResetError2 #reDirect").click(function () {
                    location.replace("../index.html");
                })
            } else if (phpvars.invalid_url === true) {
                $("#modalResetError2").modal('show');
                $(".modalTitle").html("Invalid URL!");
                $(".modalContent").html("Error while processing your request.");
                $("#modalResetError2 #reDirect").click(function () {
                    location.replace("../index.html");
                })
                return false;
            } else {
                $("#modalResetError2").modal('show');
                $(".modalTitle").html("Unknown error!");
                $(".modalContent").html("An unknown error has occurred.");
                $("#modalResetError2 #reDirect").click(function () {
                    location.replace("../index.html");
                })
                return false;
            }
        });
    });

   

});