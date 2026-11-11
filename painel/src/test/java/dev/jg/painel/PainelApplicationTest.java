package dev.jg.painel;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.core.env.Environment;

@SpringBootTest
@Import(TestcontainersConfig.class)
class PainelApplicationTest {

    @Autowired
    Environment env;

    @Test
    void contextLoads() {
    }

    @Test
    void escutaSoNoLoopback() {
        assertThat(env.getProperty("server.address")).isEqualTo("127.0.0.1");
    }
}
