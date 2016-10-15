(function ($) {

    /**
     *  weui dialog
     * @param {Object} [options]
     */
    $.weui.dialog = function (options) {
        options = $.extend({
            title: '标题',
            content: '内容',
            className: '',
            buttons: [{
                label: '确定',
                type: 'primary',
                onClick: $.noop
            }]
        }, options);

        const buttons = options.buttons.map((button) => {
            return `<a href="javascript:;" class="weui-dialog__btn weui-dialog__btn_${button.type}">${button.label}</a>`;
        }).join('\n');
        const html = `<div class="${options.className}">
                <div class="weui-mask"></div>
                <div class="weui-dialog">
                    <div class="weui-dialog__hd">
                        <strong class="weui-dialog__title">
                            ${options.title}
                        </strong>
                    </div>
                    <div class="weui-dialog__bd">
                        ${options.content}
                    </div>
                    <div class="weui-dialog__ft">
                        ${buttons}
                    </div>
                </div>
            </div>`;
        var $dialog = $(html);
        $('body').append($dialog);
        $dialog.on('click', '.weui-dialog__btn', function () {
            const button = options.buttons[$(this).index()];
            const cb = button.onClick || $.noop;
            cb.call();
            $.weui.closeDialog($dialog);
        });
    };

    /**
     * close dialog
     */
    $.weui.closeDialog = function ($dialog) {
        if ($dialog) {
            $dialog.off('click');
            // zepto 核心不包含动画相关的方法
            if (typeof $dialog.fadeOut === 'function') {
                $dialog.fadeOut('fast', () => {
                    $dialog.remove();
                    $dialog = null;
                });
            }
            else {
                $dialog.remove();
                $dialog = null;
            }
        }
    };

})($);