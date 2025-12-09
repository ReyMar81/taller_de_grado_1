<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('username','password') displayInfo=realm.password && realm.registrationAllowed && !registrationDisabled??; section>
    <#if section = "header">
        <div class="dubss-logo">
            <img src="${url.resourcesPath}/img/logo.png" alt="DUBS Logo" onerror="this.style.display='none';this.nextElementSibling.style.display='block';" />
            <span class="dubss-logo-text" style="display:none;">D</span>
        </div>
        <h1>D.U.B.S.S.</h1>
        <p class="subtitle">Dirección Universitaria de</p>
        <p class="subtitle">Bienestar Social y Salud</p>
        <p class="year">© 2025 UAGRM</p>
    <#elseif section = "form">
        <div id="kc-form">
            <div id="kc-form-wrapper">
                <h2 id="kc-page-title">Inicio de Sesión</h2>
                <p class="subtitle-form">Ingrese con sus credenciales</p>

                <#if realm.password>
                    <form id="kc-form-login" onsubmit="login.disabled = true; return true;" action="${url.loginAction}" method="post">
                        <div class="${properties.kcFormGroupClass!}">
                            <label for="username" class="${properties.kcLabelClass!}">
                                <#if !realm.loginWithEmailAllowed>
                                    ${msg("username")}
                                <#elseif !realm.registrationEmailAsUsername>
                                    Registro Universitario, Correo o Usuario
                                <#else>
                                    ${msg("email")}
                                </#if>
                            </label>

                            <input tabindex="1" 
                                   id="username" 
                                   class="${properties.kcInputClass!}" 
                                   name="username"
                                   value="${(login.username!'')}"  
                                   type="text" 
                                   autofocus 
                                   autocomplete="off"
                                   placeholder="Ingrese su registro, correo o usuario"
                                   aria-invalid="<#if messagesPerField.existsError('username','password')>true</#if>"
                            />

                            <#if messagesPerField.existsError('username','password')>
                                <span id="input-error" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                                    ${kcSanitize(messagesPerField.getFirstError('username','password'))?no_esc}
                                </span>
                            </#if>
                        </div>

                        <div class="${properties.kcFormGroupClass!}">
                            <label for="password" class="${properties.kcLabelClass!}">${msg("password")}</label>

                            <input tabindex="2" 
                                   id="password" 
                                   class="${properties.kcInputClass!}" 
                                   name="password"
                                   type="password" 
                                   autocomplete="off"
                                   placeholder="Ingrese su contraseña"
                                   aria-invalid="<#if messagesPerField.existsError('username','password')>true</#if>"
                            />
                        </div>

                        <div class="${properties.kcFormGroupClass!} ${properties.kcFormSettingClass!}">
                            <div id="kc-form-options">
                                <#if realm.rememberMe && !usernameEditDisabled??>
                                    <div class="checkbox">
                                        <label>
                                            <#if login.rememberMe??>
                                                <input tabindex="3" id="rememberMe" name="rememberMe" type="checkbox" checked> ${msg("rememberMe")}
                                            <#else>
                                                <input tabindex="3" id="rememberMe" name="rememberMe" type="checkbox"> Recordarme
                                            </#if>
                                        </label>
                                    </div>
                                </#if>
                            </div>
                            <div class="${properties.kcFormOptionsWrapperClass!}">
                                <#if realm.resetPasswordAllowed>
                                    <span><a tabindex="5" href="${url.loginResetCredentialsUrl}">Olvidé mi contraseña</a></span>
                                </#if>
                            </div>
                        </div>

                        <div id="kc-form-buttons" class="${properties.kcFormGroupClass!}">
                            <input type="hidden" id="id-hidden-input" name="credentialId" <#if auth.selectedCredential?has_content>value="${auth.selectedCredential}"</#if>/>
                            <input tabindex="4" 
                                   class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}" 
                                   name="login" 
                                   id="kc-login" 
                                   type="submit" 
                                   value="Ingresar"
                            />
                        </div>
                    </form>
                </#if>
            </div>
        </div>
    <#elseif section = "info" >
        <#if realm.password && realm.registrationAllowed && !registrationDisabled??>
            <div id="kc-registration-container">
                <div id="kc-registration">
                    <span>¿Eres estudiante y no tienes cuenta? <a tabindex="6" href="${url.registrationUrl}">Regístrate aquí</a></span>
                </div>
            </div>
        </#if>
        <div class="copyright">
            <p>© 2025 DUBS - Todos los derechos reservados</p>
        </div>
    </#if>

</@layout.registrationLayout>
