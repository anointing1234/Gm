$(document).ready(function () {
    $.post('../assets/php/delete_notifications.php');

    var barType = 'line';

    refresh_dashboard();
    load_personal_info();
    initialize_notification_list();
    initialize_investment_history();
    loadCashFlowChart();

    var readProfilePictureURL = function (input) {
        if (input.files && input.files[0]) {
            var reader = new FileReader();
            reader.onload = function (e) {
                $('#profilePic').attr('src', e.target.result);
                $('#dashboardProfilePIC').attr('src', e.target.result);
                $('#personalInfoProfilePic').attr('src', e.target.result);
            }
            reader.readAsDataURL(input.files[0]);
        }
    }

    $("#uploadContainer").on('click', function () {
        $("#fileUploadInput").click();
    });

    $("#fileUploadInput").on('change', function () {
        var fileUploadInputFiles = $(this).get(0).files;

        if (fileUploadInputFiles.length > 0) {
            var previewImage = this;

            var formData = new FormData();
            var jqfile = fileUploadInputFiles[0];
            formData.append('fileToUpload', jqfile, jqfile.name);

            $.ajax({
                async: true,
                url: "../assets/php/upload_pp.php",
                type: "POST",
                data: formData,
                contentType: false,
                processData: false,
            }).done(function (return_data) {
                var phpvars = JSON.parse(return_data);

                if (phpvars.validToUpload === true) {
                    toastr["success"]("<b>Profile picture updated...</b>");
                    readProfilePictureURL(previewImage);
                    return false;
                }
                if (phpvars.validToUpload === false) {
                    toastr["error"]("<b>" + phpvars.errorMessage + "</b>");
                    return false;
                }
            })
        }
    });

    $('#tfAmount').focusout(function (e) {
        $(this).val(thousands_separators($(this).val()))
    });
    $('#tfAmount').focusin(function (e) {
        $(this).val($(this).val().replace(/,/g, ''))
    });

    $("#investmentsMenu").click(function (e) {
        e.preventDefault();
        if (!$(this).hasClass('isDisabled')) {
            initialize_investments_modal();
            $("#investmentsModal").modal('show');
        } else {
            toastr["info"]("<b>No investment history</b>");
        }
    });

    $("#investmentHistoryMenu").click(function (e) {
        e.preventDefault();
        if (!$(this).hasClass('isDisabled')) {
            initialize_investment_history_modal();
            $("#investmentHistoryModal").modal('show');
        } else {
            toastr["info"]("<b>No investment history</b>");
        }
    });

    $("#profileSettings").click(function (e) {
        $.ajax({
            async: true,
            url: "",
            type: "POST",
        }).done(function (return_data) {
            var phpvars = JSON.parse(return_data);
            if (phpvars.info_loaded === true) {
                $('#psUserID').html(phpvars.userid);
                $('#psName').html(phpvars.fullname);
                $('#psMobile').html(phpvars.phone);
                $('#psGender').html(phpvars.sex);
                $('#psDOB').html(phpvars.dob);
                $('#psMail').html(phpvars.email);
                $('#psAddress').html(phpvars.address);

                $('#profileSettingsModal').modal('show');
            } else if (phpvars.info_loaded === false) {
                toastr["error"]('<b>Error occurred while loading your profile information.</b>');
                return false;
            }
        })
    });

    // refresh notifications, dashboard and others doms elements
    (function () {
        setInterval(function () {
            refresh_dashboard();
            load_personal_info();
            // initialize_investment_history();
            initialize_notification_list();
        }, 5000);
    })();

    function initialize_notification_list() {
        $.ajax({
            async: true,
            url: "../assets/php/load_user_notifications.php",
            type: "POST"
        }).done(function (return_data) {
            var phpvars = JSON.parse(return_data);
            var i = 0;

            if (phpvars.record_count < 1) {
                $("#n-count").addClass("d-none");
                $("#navbarDropdownNotification").removeClass("notification-indicator");
                $("#markAllRead").addClass("isDisabled");
            }

            $(".notification-body").empty();

            while (i !== phpvars.record_count) {

                var options = {
                    valueNames: ['n-message', 'n-time', 'n-id', 'nstatus'],
                    item: '<div class="list-group-item">\n' +
                        '<a class="notification notification-flush notification-unread cursor-pointer" id="n-status">\n' +
                        '<div class="d-flex flex-column w-100 notification-body">\n' +
                        '<div class="notification-message text-800 n-message"></div>\n' +
                        '<div class="d-flex mt-2 align-items-center">\n' +
                        '<div class="me-auto text-600 n-time"></div>\n' +
                        '<div class="text-secondary hover-primary me-2 readNotification" data-bs-toggle="tooltip" data-bs-placement="top" title="Mark as read" style="cursor: pointer !important;"><span class="d-none nstatus" id="n-read"></span><i class="fas fa-eye"></i></div>\n' +
                        '<div class="text-secondary hover-danger ms-2 clearNotification" data-bs-toggle="tooltip" data-bs-placement="top" title="Delete notification" style="cursor: pointer !important;"><span class="d-none n-id" id="n-id"></span><i class="fas fa-times"></i></div>\n' +
                        '</div>\n' +
                        '</div>\n' +
                        '</a>\n' +
                        '</div>'
                };

                var notificationList = new List('notification-panel', options);

                notificationList.add({
                    'n-id': phpvars.nid[i],
                    'nstatus': phpvars.nstatus[i],
                    'n-message': phpvars.nmessage[i],
                    'n-time': '<span class="me-2 fs-0 far fa-clock text-500"></span>' + phpvars.ndate[i] + ''
                });
                i++;
            }

            refresh_notification();

            $(".clearNotification").click(function () {
                var jq_item_id = $(this).children('.n-id').text();
                var jq_item_date = $(this).siblings('.n-time').text();

                notificationList.remove('n-id', jq_item_id);

                $.ajax({
                    async: true,
                    url: "../assets/php/n_delete.php",
                    type: "POST",
                    dataType: "text",
                    data: {php_item_id: jq_item_id, php_item_date: jq_item_date}
                }).done(function (return_data) {
                    var phpvars = JSON.parse(return_data);

                    if (phpvars.delete_success === true) {
                        refresh_notification();
                        toastr["success"]('<b>Notification deleted</b>');
                        if (notificationList.size() === 0) {
                            $("#n-count").addClass("d-none");
                            $("#navbarDropdownNotification").removeClass("notification-indicator");
                            $("#markAllRead").addClass("isDisabled");
                        }
                    } else if (phpvars.delete_success === false) {
                        toastr["error"]('<b>Error! please try again</b>');
                        return false;
                    } else if (phpvars.error === true) {
                        toastr["error"]('<b>Server error!</b>');
                        return false;
                    } else {
                        toastr["error"]('<b>Unknown error! please try again</b>');
                        return false;
                    }
                })
            });

            $(".readNotification").click(function () {
                var jq_item_id = $(this).siblings('.clearNotification').children(".n-id").text();
                var jq_item_date = $(this).siblings('.n-time').text();
                if ($(this).text() === "UNREAD") {
                    $(this).text("READ");
                    $(this).addClass("d-none");
                    $(this).closest("#n-status").removeClass("notification-unread");
                }

                $.ajax({
                    async: true,
                    url: "../assets/php/n_read.php",
                    type: "POST",
                    dataType: "text",
                    data: {php_item_id: jq_item_id, php_item_date: jq_item_date}
                }).done(function (return_data) {
                    var phpvars = JSON.parse(return_data);

                    if (phpvars.update_success === true) {
                        refresh_notification();
                        toastr["success"]('<b>Notification marked as read</b>');
                    } else if (phpvars.update_success === false) {
                        toastr["error"]('<b>Error! please try again</b>');
                        return false;
                    } else if (phpvars.error === true) {
                        toastr["error"]('<b>Server error!</b>');
                        return false;
                    } else {
                        toastr["error"]('<b>Unknown error! please try again</b>');
                        return false;
                    }
                })
            });

        })
    }

    $("#markAllRead").click(function () {
        if (!$(this).hasClass('isDisabled')) {
            var unreadCount = 0;
            $('.nstatus').each(function (i) {
                if ($(this).text() === "Unread") {
                    $(this).text("Read");
                    $(this).closest("#n-status").removeClass("notification-unread");
                }
                unreadCount = $(this).closest('.notification-unread').length;
            })

            listCount = $('.nstatus').length;

            if (listCount === 0) {
                $("#view-all-notification").addClass("isDisabled");
                $("#markAllRead").addClass("isDisabled");
            }

            if (unreadCount === 0) {
                $("#n-count").addClass("d-none");
                $("#navbarDropdownNotification").removeClass("notification-indicator");
                $("#markAllRead").addClass("isDisabled");
            }

            $.ajax({
                async: true,
                url: "../assets/php/n_read_all.php",
                type: "POST"
            }).done(function (return_data) {
                var phpvars = JSON.parse(return_data);

                if (phpvars.update_success === true) {
                    refresh_notification();
                    toastr["success"]('<b>All notification marked as read</b>');
                } else if (phpvars.update_success === false) {
                    toastr["error"]('<b>Error! please try again</b>');
                    return false;
                } else if (phpvars.error === true) {
                    toastr["error"]('<b>Server error!</b>');
                    return false;
                } else {
                    toastr["error"]('<b>Unknown error! please try again</b>');
                    return false;
                }
            })
        }
    });

    function refresh_dashboard() {
        var i = 0;

        $.post('../assets/php/delete_notifications.php');

        $.ajax({
            async: true,
            url: "../assets/php/load_user_investments.php",
            type: "POST"
        }).done(function (return_data) {
                var phpvars = JSON.parse(return_data);

                $("#investmentsMenu").addClass("isDisabled");

                $("#accountBalance").html('$' + thousands_separators(0.00));
                $("#totalReturn").html('$' + thousands_separators(0.00));
                $("#withdrawalBalance").html('$' + thousands_separators(0.00));
                $("#startDate").html('0000-00-00');
                $("#investmentStatus").html('NONE');
                $("#daysCount").html(0);
                $("#roi").html('$' + thousands_separators(0.00));

                if (phpvars.record_count > 0) {
                    $("#investmentsMenu").removeClass("isDisabled");
                    while (i !== phpvars.record_count) {
                        $("#accountBalance").html('$' + thousands_separators(phpvars.amount[i]));
                        $("#totalReturn").html('$' + thousands_separators(parseInt(phpvars.amount[i]) + parseInt(phpvars.roi[i])));
                        $("#withdrawalBalance").html('$' + thousands_separators(0.00));
                        $("#startDate").html(phpvars.start_date[i]);
                        $("#investmentStatus").html(phpvars.status[i]);
                        $("#daysCount").html(phpvars.days_count[i]);
                        $("#roi").html('$' + thousands_separators(phpvars.roi[i]));
                        i++;
                    }
                }

            if ($('#accountBalance').data("account-balance-visible") === false) {
                $('#accountBalance').data("account-balance", $('#accountBalance').text());
                $('#accountBalance').text("******");
                $('#accountBalanceEye').attr("data-bs-original-title", "show");
                $('.accountBalanceEye').addClass("fa-eye-slash").removeClass("fa-eye");
            }
            if ($('#roi').data("roi-balance-visible") === false) {
                $('#roi').data("roi-balance", $('#roi').text());
                $('#roi').text("******");
                $('#roiEye').attr("data-bs-original-title", "show");
                $('.roiEye').addClass("fa-eye-slash").removeClass("fa-eye");
            }
            if ($('#totalReturn').data("total-return-balance-visible") === false) {
                $('#totalReturn').data("total-return-balance", $('#totalReturn').text());
                $('#totalReturn').text("******");
                $('#totalReturnEye').attr("data-bs-original-title", "show");
                $('.totalReturnEye').addClass("fa-eye-slash").removeClass("fa-eye");
            }
            if ($('#withdrawalBalance').data("withdrawal-balance-visible") === false) {
                $('#withdrawalBalance').data("withdrawal-balance", $('#withdrawalBalance').text());
                $('#withdrawalBalance').text("******");
                $('#withdrawalBalanceEye').attr("data-bs-original-title", "show");
                $('.withdrawalBalanceEye').addClass("fa-eye-slash").removeClass("fa-eye");
            }

            }
        );
    }

    function load_personal_info() {
        $.ajax({
            async: true,
            url: "",
            type: "POST",
        }).done(function (return_data) {
            var phpvars = JSON.parse(return_data);
            if (phpvars.info_loaded === true) {
                $('#piName').html(phpvars.fullname);
                $('#piEmail').html(phpvars.email);
                $('#piPhone').html(phpvars.phone);
                $('#piAddress').html(phpvars.address);
            } else if (phpvars.info_loaded === false) {
                toastr["error"]('<b>Error occurred while loading your profile information.</b>');
                return false;
            }
        })
    }

    function initialize_investment_history() {
        $.ajax({
            async: true,
            url: "../assets/php/load_user_investment_history.php",
            type: "POST",
            cache: false,
        }).done(function (return_data) {
            var phpvars = JSON.parse(return_data);
            if (phpvars.record_count > 0) {
                $("#investmentHistory").removeClass("d-none");
                $("#investmentHistoryMenu").removeClass("isDisabled");

                var i = 0;

                var statusBadgeType = "";
                var statusBadgeIcon = "";
                var statusBadgeText = "";

                while (i !== phpvars.record_count) {
                    if (phpvars.tstatus[i] === "COMPLETED") {
                        statusBadgeType = "badge-subtle-success";
                        statusBadgeIcon = "fas fa-check";
                        statusBadgeText = "COMPLETED";
                    } else if (phpvars.tstatus[i] === "RUNNING") {
                        statusBadgeType = "badge-subtle-primary";
                        statusBadgeIcon = "fas fa-spinner fa-spin-pulse";
                        statusBadgeText = "PROCESSING";
                    } else if (phpvars.tstatus[i] === "EXPIRED") {
                        statusBadgeType = "badge-subtle-warning";
                        statusBadgeIcon = "fas fa-xmark fa-beat-fade";
                        statusBadgeText = "UNDER-REVIEW";
                    } else if (phpvars.tstatus[i] === "ON-HOLD") {
                        statusBadgeType = "badge-subtle-secondary";
                        statusBadgeIcon = "fas fa-ban";
                        statusBadgeText = "ON-HOLD";
                    }

                    $("#tableInvestmentHistoryBody").append("<tr class='cursor-pointer'>\n" +
                        "<td class='align-middle white-space-nowrap px-2 date'>" + phpvars.tdate[i] + "</td>\n" +
                        "<td class='align-middle white-space-nowrap px-2 description d-none d-md-table-cell'>" + phpvars.tdescription[i] + "</td>\n" +
                        "<td class='align-middle white-space-nowrap px-2 amount'>$ " + thousands_separators(phpvars.tamount[i]) + "</td>\n" +
                        "<td class='align-middle white-space-nowrap px-2 status'><span class='d-block badge rounded-pill " + statusBadgeType + "'><span class='me-1 " + statusBadgeIcon + "' data-fa-transform='shrink-2'></span>" + phpvars.tstatus[i] + "</span></td>\n" +
                        "</tr>");
                    i++
                }
                initDataTableBasic("#investmentHistory");
            } else {
                $("#investmentHistory").addClass("d-none");
                $("#investmentHistoryMenu").addClass("isDisabled");
            }
        })
    }

    function initialize_investment_history_modal() {
        $.ajax({
            async: true,
            url: "../assets/php/load_user_investment_history.php",
            type: "POST"
        }).done(function (return_data) {
            var phpvars = JSON.parse(return_data);

            if (phpvars.record_count > 0) {
                var i = 0;

                var statusBadgeType = "";
                var statusBadgeIcon = "";
                var statusBadgeText = "";

                while (i !== phpvars.record_count) {
                    if (phpvars.tstatus[i] === "COMPLETED") {
                        statusBadgeType = "badge-subtle-success";
                        statusBadgeIcon = "fas fa-check";
                        statusBadgeText = "COMPLETED";
                    } else if (phpvars.tstatus[i] === "RUNNING") {
                        statusBadgeType = "badge-subtle-primary";
                        statusBadgeIcon = "fas fa-spinner fa-spin-pulse";
                        statusBadgeText = "PROCESSING";
                    } else if (phpvars.tstatus[i] === "EXPIRED") {
                        statusBadgeType = "badge-subtle-warning";
                        statusBadgeIcon = "fas fa-xmark fa-beat-fade";
                        statusBadgeText = "UNDER-REVIEW";
                    } else if (phpvars.tstatus[i] === "ON-HOLD") {
                        statusBadgeType = "badge-subtle-secondary";
                        statusBadgeIcon = "fas fa-ban";
                        statusBadgeText = "ON-HOLD";
                    }

                    $("#tableInvestmentHistoryBodyModal").append("<tr class='cursor-pointer'>\n" +
                        "<td class='align-middle white-space-nowrap px-2 date'>" + phpvars.tdate[i] + "</td>\n" +
                        "<td class='align-middle white-space-nowrap px-2 description d-none d-md-table-cell'>" + phpvars.tdescription[i] + "</td>\n" +
                        "<td class='align-middle white-space-nowrap px-2 amount'>$ " + thousands_separators(phpvars.tamount[i]) + "</td>\n" +
                        "<td class='align-middle white-space-nowrap px-2 status'><span class='d-block badge rounded-pill " + statusBadgeType + "'><span class='me-1 " + statusBadgeIcon + "' data-fa-transform='shrink-2'></span>" + phpvars.tstatus[i] + "</span></td>\n" +
                        "</tr>");
                    i++
                }
                initDataTableBasic("#investmentHistoryTableModal");
            }
        })
    }

    function initialize_investments_modal() {
        $.ajax({
            async: true,
            url: "../assets/php/load_user_investments.php",
            type: "POST"
        }).done(function (return_data) {
            var phpvars = JSON.parse(return_data);
            if (phpvars.record_count > 0) {
                var i = 0;

                var statusBadgeType = "";
                var statusBadgeIcon = "";
                var statusBadgeText = "";

                while (i !== phpvars.record_count) {
                    if (phpvars.status[i] === "COMPLETED") {
                        statusBadgeType = "badge-subtle-success";
                        statusBadgeIcon = "fas fa-check";
                        statusBadgeText = "COMPLETED";
                    } else if (phpvars.status[i] === "RUNNING") {
                        statusBadgeType = "badge-subtle-primary";
                        statusBadgeIcon = "fas fa-spinner fa-spin-pulse";
                        statusBadgeText = "PROCESSING";
                    } else if (phpvars.status[i] === "EXPIRED") {
                        statusBadgeType = "badge-subtle-warning";
                        statusBadgeIcon = "fas fa-xmark fa-beat-fade";
                        statusBadgeText = "UNDER-REVIEW";
                    } else if (phpvars.status[i] === "ON-HOLD") {
                        statusBadgeType = "badge-subtle-secondary";
                        statusBadgeIcon = "fas fa-ban";
                        statusBadgeText = "ON-HOLD";
                    }

                    $("#tableInvestmentsModalBody").append("<tr class='cursor-pointer'>\n" +
                        "<td class='align-middle white-space-nowrap px-2 startdate'>" + phpvars.start_date[i] + "</td>\n" +
                        "<td class='align-middle white-space-nowrap px-2 enddate'>" + phpvars.end_date[i] + "</td>\n" +
                        "<td class='align-middle white-space-nowrap px-2 amount'>$ " + thousands_separators(phpvars.amount[i]) + "</td>\n" +
                        "<td class='align-middle white-space-nowrap px-2 status'><span class='d-block badge rounded-pill " + statusBadgeType + "'><span class='me-1 " + statusBadgeIcon + "' data-fa-transform='shrink-2'></span>" + phpvars.status[i] + "</span></td>\n" +
                        "</tr>");
                    i++
                }
                initDataTableBasic("#investmentsTableModal");
            }
        })
    }

    function thousands_separators(number) {
        const num_parts = parseFloat(number).toFixed(2).toString().split(".");
        num_parts[0] = num_parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return num_parts.join(".");
    }

    function initDataTable(tableID) {
        if (!$.fn.DataTable.isDataTable(tableID)) {
            dataTable = $(tableID).DataTable({
                info: true,
                ordering: true,
                paging: true,
                lengthChange: true,
                // processing: true,
                lengthMenu: [[5, 10, 25, 50, 75, 100, -1], [5, 10, 25, 50, 75, 100, 'All']],
                order: [0, 'desc'],
                select: true,
                dom: "<'row mx-0'<'col-md-6'l><'col-md-6'f>>" + "<'table-responsive scrollbar'tr>" + "<'row g-0 align-items-center justify-content-center justify-content-sm-between'<'col-auto mb-2 mb-sm-0 px-3'i><'col-auto px-3'p>>"
            });
            $('.pagination').addClass('pagination-sm');
        } else {
            dataTable = $(tableID).DataTable({
                destroy: true,
                info: true,
                ordering: true,
                paging: true,
                lengthChange: true,
                // processing: true,
                lengthMenu: [[5, 10, 25, 50, 75, 100, -1], [5, 10, 25, 50, 75, 100, 'All']],
                order: [0, 'desc'],
                select: true,
                dom: "<'row mx-0'<'col-md-6'l><'col-md-6'f>>" + "<'table-responsive scrollbar'tr>" + "<'row g-0 align-items-center justify-content-center justify-content-sm-between'<'col-auto mb-2 mb-sm-0 px-3'i><'col-auto px-3'p>>"
            });
            $('.pagination').addClass('pagination-sm');
        }
    }

    function initDataTableBasic(tableID) {
        if (!$.fn.DataTable.isDataTable(tableID)) {
            dataTable = $(tableID).DataTable({
                ordering: true,
                paging: true,
                lengthChange: false,
                filter: false,
                order: [0, 'desc'],
                select: true,
                dom: "<'row mx-0'<'col-md-6'l><'col-md-6'f>>" + "<'table-responsive scrollbar'tr>" + "<'row g-0 align-items-center justify-content-center justify-content-sm-between'<'col-auto mb-2 mb-sm-0 px-3'i><'col-auto px-3'p>>"
            });
            $('.pagination').addClass('pagination-sm');
        } else {
            dataTable = $(tableID).DataTable({
                destroy: true,
                ordering: true,
                paging: true,
                lengthChange: false,
                filter: false,
                order: [0, 'desc'],
                select: true,
                dom: "<'row mx-0'<'col-md-6'l><'col-md-6'f>>" + "<'table-responsive scrollbar'tr>" + "<'row g-0 align-items-center justify-content-center justify-content-sm-between'<'col-auto mb-2 mb-sm-0 px-3'i><'col-auto px-3'p>>"
            });
            $('.pagination').addClass('pagination-sm');
        }
    }

    function refresh_notification() {
        var unreadCount = 0;
        $('.nstatus').each(function () {
            if ($(this).text() === "UNREAD") {
                $(this).closest("#n-status").addClass("notification-unread");
                unreadCount++;
                $('#n-count').text(unreadCount);
            } else if ($(this).text() === "READ") {
                $(this).closest("#n-status").removeClass("notification-unread");
            }
        })

        if (unreadCount === 0) {
            $("#n-count").addClass("d-none");
            $("#navbarDropdownNotification").removeClass("notification-indicator");
            $("#markAllRead").addClass("isDisabled");
        } else {
            $("#n-count").removeClass("d-none");
            $("#navbarDropdownNotification").addClass("notification-indicator");
            $("#markAllRead").removeClass("isDisabled");
        }

        $('.nstatus').each(function (i) {
            if ($(this).text() === "READ") {
                $(this).siblings('.fa-eye').addClass("d-none");
            } else {
                $(this).siblings('.fa-eye').removeClass("d-none");
            }
        })

        $('#nCount').text(unreadCount);
    }

    toastr.options = {
        "closeButton": false,
        "debug": false,
        "newestOnTop": true,
        "progressBar": true,
        "positionClass": "toast-bottom-full-width",
        "preventDuplicates": true,
        "onclick": null,
        "showDuration": "300",
        "hideDuration": "1000",
        "timeOut": "5000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
    }

    function loadCashFlowChart() {
        $.ajax({
            async: true,
            url: "../assets/php/load_chart_data.php",
            type: "POST",
            dataType: "text",
            data: {phpchartquarter: "ALL"}
        }).done(function (return_data) {
            var phpchartALL = JSON.parse(return_data);
            cashFlowChart(phpchartALL, "line", "10px", "15%");
        })
    }

    $("#chartType").on("change", function () {
        barType = this.value;
        if ($("#chartQuarter option:selected").val() === "Q1") {
            loadChartQ1(barType);
        }
        if ($("#chartQuarter option:selected").val() === "Q2") {
            loadChartQ2(barType);
        }
        if ($("#chartQuarter option:selected").val() === "Q3") {
            loadChartQ3(barType);
        }
        if ($("#chartQuarter option:selected").val() === "Q4") {
            loadChartQ4(barType);
        }
        if ($("#chartQuarter option:selected").val() === "ALL") {
            loadChartALL(barType);
        }
    });

    $("#chartQuarter").on("change", function () {
        barType = $("#chartType option:selected").val();
        if (this.value === "Q1") {
            loadChartQ1(barType);
        }

        if (this.value === "Q2") {
            loadChartQ2(barType);
        }

        if (this.value === "Q3") {
            loadChartQ3(barType);
        }

        if (this.value === "Q4") {
            loadChartQ4(barType);
        }

        if (this.value === "ALL") {
            loadChartALL(barType);
        }
    });


    /* -------------------------------------------------------------------------- */
    /*                        Cash Flow History Chart                           */

    /* -------------------------------------------------------------------------- */


    function loadChartQ1(barType, barWidth, barGap) {
        $.ajax({
            async: true,
            url: "../assets/php/load_chart_data.php",
            type: "POST",
            dataType: "text",
            data: {phpchartquarter: "Q1"}
        }).done(function (return_data) {
            var phpchartQ1 = JSON.parse(return_data);
            cashFlowChart(phpchartQ1, barType, barWidth, barGap);
        })
    }

    function loadChartQ2(barType, barWidth, barGap) {
        $.ajax({
            async: true,
            url: "../assets/php/load_chart_data.php",
            type: "POST",
            dataType: "text",
            data: {phpchartquarter: "Q2"}
        }).done(function (return_data) {
            var phpchartQ2 = JSON.parse(return_data);
            cashFlowChart(phpchartQ2, barType, barWidth, barGap);
        })
    }

    function loadChartQ3(barType, barWidth, barGap) {
        $.ajax({
            async: true,
            url: "../assets/php/load_chart_data.php",
            type: "POST",
            dataType: "text",
            data: {phpchartquarter: "Q3"}
        }).done(function (return_data) {
            var phpchartQ3 = JSON.parse(return_data);
            cashFlowChart(phpchartQ3, barType, barWidth, barGap);
        })
    }

    function loadChartQ4(barType, barWidth, barGap) {
        $.ajax({
            async: true,
            url: "../assets/php/load_chart_data.php",
            type: "POST",
            dataType: "text",
            data: {phpchartquarter: "Q4"}
        }).done(function (return_data) {
            var phpchartQ4 = JSON.parse(return_data);
            cashFlowChart(phpchartQ4, barType, barWidth, barGap);
        })
    }

    function loadChartALL(barType, barWidth, barGap) {
        $.ajax({
            async: true,
            url: "../assets/php/load_chart_data.php",
            type: "POST",
            dataType: "text",
            data: {phpchartquarter: "ALL"}
        }).done(function (return_data) {
            var phpchartALL = JSON.parse(return_data);
            cashFlowChart(phpchartALL, barType, barWidth, barGap);
        })
    }

    function cashFlowChart(chartData, barType, barWidth, barGap) {
        var CASH_FLOW_CHART = '.cash-flow-chart';
        var $cashFlowChart = document.querySelector(CASH_FLOW_CHART);
        if ($cashFlowChart) {
            var data = chartData;
            var userOptions = utils.getData($cashFlowChart, 'options');
            var chart = window.echarts.init($cashFlowChart);
            var getDefaultOptions = function getDefaultOptions() {
                return {
                    color: [utils.getColors().primary, utils.getGrays()['300']],
                    dataset: {
                        source: data
                    },
                    tooltip: {
                        trigger: 'item',
                        padding: [7, 10],
                        backgroundColor: utils.getGrays()['100'],
                        borderColor: utils.getGrays()['300'],
                        textStyle: {
                            color: utils.getColors().dark
                        },
                        borderWidth: 1,
                        transitionDuration: 0,
                        position: function position(pos, params, dom, rect, size) {
                            return getPosition(pos, params, dom, rect, size);
                        },
                        formatter: function formatter(params) {
                            return "<div class=\"font-weight-semi-bold\">".concat(params.seriesName, "</div><div class=\"fs--1 text-600\"><strong>").concat(params.name, ":</strong> $").concat(thousands_separators(params.value[params.componentIndex + 1]), "</div>");
                        }
                    },
                    legend: {
                        data: ['Deposits', 'Withdrawals'],
                        left: 'left',
                        itemWidth: 15,
                        itemHeight: 15,
                        borderRadius: 0,
                        icon: 'circle',
                        inactiveColor: utils.getGrays()['400'],
                        textStyle: {
                            color: utils.getGrays()['700']
                        }
                    },
                    xAxis: {
                        type: 'category',
                        axisLabel: {
                            color: utils.getGrays()['500']
                        },
                        axisLine: {
                            lineStyle: {
                                color: utils.getGrays()['300'],
                                type: 'dashed'
                            }
                        },
                        axisTick: true,
                        boundaryGap: true
                    },
                    yAxis: {
                        axisPointer: {
                            type: ''
                        },
                        axisTick: 'none',
                        splitLine: {
                            lineStyle: {
                                color: utils.getGrays()['300'],
                                type: 'dashed'
                            }
                        },
                        axisLine: {
                            show: true,
                            lineStyle: {
                                color: utils.getGrays()['300'],
                                type: 'dashed'
                            }

                        },
                        axisLabel: {
                            show: false,
                            color: utils.getGrays()['500']
                        }
                    },
                    series: [{
                        type: barType,
                        barWidth: barWidth,
                        barGap: barGap,
                        label: {
                            normal: {
                                show: false
                            }
                        },
                        z: 10,
                        itemStyle: {
                            normal: {
                                barBorderRadius: [10, 10, 0, 0],
                                color: utils.getColors().success
                            }
                        },
                        symbol: 'circle',
                        symbolSize: 10,
                        hoverAnimation: true,
                        areaStyle: {
                            color: {
                                type: 'linear',
                                x: 0,
                                y: 0,
                                x2: 0,
                                y2: 1,
                                colorStops: [{
                                    offset: 0,
                                    color: utils.rgbaColor(utils.getColor('success'), 0.2)
                                }, {
                                    offset: 1,
                                    color: utils.rgbaColor(utils.getColor('success'), 0)
                                }]
                            }
                        }
                    }, {
                        type: barType,
                        barWidth: barWidth,
                        barGap: barGap,
                        label: {
                            normal: {
                                show: false
                            }
                        },
                        itemStyle: {
                            normal: {
                                barBorderRadius: [4, 4, 0, 0],
                                color: utils.getColors().danger
                            }
                        },
                        symbol: 'circle',
                        symbolSize: 10,
                        hoverAnimation: true,
                        areaStyle: {
                            color: {
                                type: 'linear',
                                x: 0,
                                y: 0,
                                x2: 0,
                                y2: 1,
                                colorStops: [{
                                    offset: 0,
                                    color: utils.rgbaColor(utils.getColor('danger'), 0.2)
                                }, {
                                    offset: 1,
                                    color: utils.rgbaColor(utils.getColor('danger'), 0)
                                }]
                            }
                        }
                    }],
                    grid: {
                        right: '0',
                        left: '30px',
                        bottom: '10%',
                        top: '20%'
                    }
                };
            };
            echartSetOption(chart, userOptions, getDefaultOptions);
        }
    }
});