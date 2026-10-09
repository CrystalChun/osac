<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false; section>
    <#if section = "header">
        ${msg("errorTitle")}
    <#elseif section = "form">
        <div id="kc-error-message">
            <p class="instruction">
                ${kcSanitize(message.summary)?no_esc}
            </p>

            <#-- Show helpful guidance for IDP-related errors -->
            <#if message.summary?contains("identity provider") || message.summary?contains("broker")>
                <div style="margin-top: 1.5em; padding: 1em; background-color: #f0f0f0; border-left: 4px solid #0066cc;">
                    <p style="margin: 0 0 0.5em 0; font-weight: bold;">What can I do?</p>
                    <ul style="margin: 0; padding-left: 1.5em;">
                        <li>Wait a few minutes and try again</li>
                        <li>Contact your administrator to verify the identity provider configuration</li>
                        <li>Try logging in with a different method if available</li>
                    </ul>
                </div>
            </#if>

            <#if client?? && client.baseUrl?has_content>
                <p style="margin-top: 1.5em;">
                    <a id="backToApplication" href="${client.baseUrl}">${kcSanitize(msg("backToApplication"))?no_esc}</a>
                </p>
            </#if>
        </div>
    </#elseif>
</@layout.registrationLayout>
