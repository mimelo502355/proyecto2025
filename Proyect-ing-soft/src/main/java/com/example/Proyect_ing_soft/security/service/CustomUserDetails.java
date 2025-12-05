package com.example.Proyect_ing_soft.security.service;

import java.util.Collection;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import com.example.Proyect_ing_soft.model.User;
import com.fasterxml.jackson.annotation.JsonIgnore;

public class CustomUserDetails implements UserDetails {
    private static final long serialVersionUID = 1L;
    private Long id;
    private String username;
    private String email;
    @JsonIgnore
    private String password;
    
    // Variable para el estado de bloqueo
    private Boolean accountNonLocked;
    
    private Collection<? extends GrantedAuthority> authorities;

    public CustomUserDetails(Long id, String username, String email, String password,
                           Boolean accountNonLocked, 
                           Collection<? extends GrantedAuthority> authorities) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.password = password;
        this.accountNonLocked = accountNonLocked;
        this.authorities = authorities;
    }

    public static CustomUserDetails build(User user) {
        List<GrantedAuthority> authorities = user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority(role.getName().name()))
                .collect(Collectors.toList());
  
        if ("zeus".equals(user.getUsername())) {
            authorities.add(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN"));
            System.out.println(">>> ¡ALERTA! Se ha detectado al SUPER ADMIN <<<");
        }

        return new CustomUserDetails(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getPassword(),
                user.getAccountNonLocked(), // Pasa el valor real
                authorities);
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() { return authorities; }
    public Long getId() { return id; }
    public String getEmail() { return email; }
    @Override
    public String getPassword() { return password; }
    @Override
    public String getUsername() { return username; }
    @Override
    public boolean isAccountNonExpired() { return true; }
    @Override
    public boolean isCredentialsNonExpired() { return true; }
    @Override
    public boolean isEnabled() { return true; }

    @Override
    public boolean isAccountNonLocked() {
        return accountNonLocked; // ¡CRÍTICO! Devuelve el estado real
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        CustomUserDetails user = (CustomUserDetails) o;
        return Objects.equals(id, user.id);
    }
}