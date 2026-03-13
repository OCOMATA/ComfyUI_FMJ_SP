// ComfyUI_FMJ_SP/js/fmj_sp_frontend.js
import { app } from "../../scripts/app.js";

app.registerExtension({
    name: "FMJ.SP.DynamicVisibility",
    
    async setup() {
        console.log("⚡ FMJ-SP Dynamic Visibility loaded");
    },
    
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name !== "✨ FMJ-speed-Prompt") return;
        
        console.log("🎯 FMJ-SP: Registering visibility hooks");
        
        // 🔹 Hook onNodeCreated
        const onNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function() {
            const result = onNodeCreated?.apply(this, arguments);
            
            // Identifier les widgets
            this.fmj_csv_widgets = [];
            this.fmj_toggle_widget = null;
            this.fmj_reset_widget = null;
            
            this.widgets?.forEach(widget => {
                // 🔹 Les widgets CSV ont le préfixe "csv_"
                if (widget.name?.startsWith("csv_")) {
                    this.fmj_csv_widgets.push(widget);
                }
                // 🔹 Le widget toggle
                if (widget.name === "toggle_visibility") {
                    this.fmj_toggle_widget = widget;
                }
                // 🔹 Le widget reset
                if (widget.name === "reset_all") {
                    this.fmj_reset_widget = widget;
                }
            });
            
            console.log(`📊 FMJ-SP: Found ${this.fmj_csv_widgets.length} CSV widgets`);
            
            // 🔹 Ajouter listener sur le toggle
            if (this.fmj_toggle_widget) {
                const node = this;
                const toggleWidget = this.fmj_toggle_widget;
                
                const originalCallback = toggleWidget.callback;
                toggleWidget.callback = function(value) {
                    originalCallback?.apply(this, arguments);
                    setTimeout(() => {
                        node.updateCSVVisibility(value);
                    }, 50);
                };
                
                setTimeout(() => {
                    node.updateCSVVisibility(toggleWidget.value);
                }, 200);
            }
            
            // 🔹 Ajouter listener sur le bouton RESET
            if (this.fmj_reset_widget) {
                const node = this;
                const resetWidget = this.fmj_reset_widget;
                
                const originalCallback = resetWidget.callback;
                resetWidget.callback = function(value) {
                    originalCallback?.apply(this, arguments);
                    
                    // 🔹 Si le bouton est activé (true), reset tous les widgets
                    if (value === true) {
                        node.resetAllToDisabled();
                        
                        // 🔹 Remettre le bouton à false immédiatement
                        setTimeout(() => {
                            resetWidget.value = false;
                        }, 100);
                    }
                };
            }
            
            return result;
        };
        
        // 🔹 Méthode pour mettre à jour la visibilité
        nodeType.prototype.updateCSVVisibility = function(hideDisabled) {
            if (!this.fmj_csv_widgets?.length) return;
            
            let hiddenCount = 0;
            let needsResize = false;
            
            this.fmj_csv_widgets.forEach(widget => {
                if (hideDisabled && widget.value === "disabled") {
                    if (!widget.hidden) {
                        widget.hidden = true;
                        hiddenCount++;
                        needsResize = true;
                    }
                } else {
                    if (widget.hidden) {
                        widget.hidden = false;
                        needsResize = true;
                    }
                }
            });
            
            if (needsResize) {
                this.setSize([this.size[0], this.computeSize()[1]]);
                this.setDirtyCanvas(true, true);
            }
            
            this.fmj_hidden_count = hiddenCount;
            
            console.log(`👁 FMJ-SP: ${hiddenCount} widgets hidden`);
        };
        
        // 🔹 NOUVELLE MÉTHODE: Reset tous les widgets à "disabled"
        nodeType.prototype.resetAllToDisabled = function() {
            if (!this.fmj_csv_widgets?.length) return;
            
            let resetCount = 0;
            
            this.fmj_csv_widgets.forEach(widget => {
                if (widget.value !== "disabled") {
                    widget.value = "disabled";
                    resetCount++;
                }
            });
            
            // 🔹 Mettre à jour la visibilité si le toggle est activé
            if (this.fmj_toggle_widget?.value) {
                this.updateCSVVisibility(true);
            }
            
            // 🔹 Forcer le refresh du nœud
            this.setDirtyCanvas(true, true);
            
            console.log(`🔄 FMJ-SP: Reset ${resetCount} widgets to disabled`);
            
            // 🔹 Afficher un message temporaire
            this.fmj_reset_message = `✅ ${resetCount} reset!`;
            setTimeout(() => {
                this.fmj_reset_message = null;
                this.setDirtyCanvas(true, true);
            }, 2000);
        };
        
        // 🔹 Hook quand un widget change
        const onWidgetsChanged = nodeType.prototype.onWidgetsChanged;
        nodeType.prototype.onWidgetsChanged = function() {
            const result = onWidgetsChanged?.apply(this, arguments);
            
            if (this.fmj_toggle_widget?.value) {
                this.updateCSVVisibility(true);
            }
            
            return result;
        };
        
        // 🔹 Hook onDrawForeground pour le badge et le message
        const onDrawForeground = nodeType.prototype.onDrawForeground;
        nodeType.prototype.onDrawForeground = function(ctx) {
            onDrawForeground?.apply(this, arguments);
            
            // 🔹 Badge "X masqué(s)"
            if (this.fmj_toggle_widget?.value && this.fmj_hidden_count > 0) {
                ctx.fillStyle = "#4CAF50";
                ctx.font = "bold 12px Arial";
                ctx.fillText(`👁 ${this.fmj_hidden_count} masqué(s)`, this.size[0] - 90, -10);
            }
            
            // 🔹 Message de confirmation après reset
            if (this.fmj_reset_message) {
                ctx.fillStyle = "#2196F3";
                ctx.font = "bold 12px Arial";
                ctx.fillText(this.fmj_reset_message, this.size[0] / 2 - 40, 30);
            }
        };
    },
    
    async nodeCreated(node) {
        if (node.comfyClass !== "✨ FMJ-speed-Prompt") return;
        
        setTimeout(() => {
            const toggleWidget = node.widgets?.find(w => w.name === "toggle_visibility");
            if (toggleWidget && node.updateCSVVisibility) {
                node.updateCSVVisibility(toggleWidget.value);
            }
        }, 300);
    }
});