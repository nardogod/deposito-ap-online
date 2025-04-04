from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _

class User(AbstractUser):
    phone = models.CharField(_("Telefone"), max_length=15, blank=True)
    address = models.TextField(_("Endereço"), blank=True)
    apartment = models.CharField(_("Apartamento"), max_length=10, blank=True)
    building = models.CharField(_("Edifício"), max_length=100, blank=True)
    is_technician = models.BooleanField(_("É técnico"), default=False)
    
    class Meta:
        verbose_name = _("Usuário")
        verbose_name_plural = _("Usuários")
    
    def __str__(self):
        return self.username