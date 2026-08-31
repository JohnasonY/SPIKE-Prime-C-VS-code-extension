#include <kernel.h>
#include <t_syslog.h>
#include "kernel_cfg.h"
#include "spike/hub/display.h"
#include "spike/hub/light.h"

void main_task(intptr_t exinf)
{
    char letter = 'A';

    syslog(LOG_NOTICE, "SPIKE Prime C app started.");

    while (1) {
        hub_display_off();
        hub_display_char(letter);
        hub_light_on_color(PBIO_COLOR_GREEN);

        letter++;
        if (letter > 'Z') {
            letter = 'A';
        }

        dly_tsk(1000 * 1000);
    }
}
