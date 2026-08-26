#include <spike.h>

int main(void) {
    motor_run(PORT_A, 50);
    wait(2000);
    motor_stop(PORT_A);

    return 0;
}
