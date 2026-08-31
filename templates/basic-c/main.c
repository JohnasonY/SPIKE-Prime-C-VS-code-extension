#include <spike.h>

int main(void)
{
    motor_run(PORT_C, 60);
    wait(2000);
    motor_stop(PORT_C);

    return 0;
}
